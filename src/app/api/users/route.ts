// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Define a User interface that matches your database schema
interface User extends RowDataPacket {
  user_id: number;
  name: string;
  user_category_id: number;
  username: string;
  password: string;
  contact_no: string;
  address: string;
  taluka_id: number;
  village_id: number;
  gp_id: number;
  company_id?: number | null;
  company_name?: string | null;
  status: number | string;
  created_at: string;
  updated_at: string;
}

export async function GET(req: Request) {
  let connection;
  try {
    // Get user_id from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token');
    const currentUserId = authToken ? parseInt(authToken.value) : null;

    // Get company_id from query parameters
    const url = new URL(req.url);
    const companyIdParam = url.searchParams.get('company_id');

    connection = await pool.getConnection();

    // Build WHERE clause conditions
    const whereConditions = ['users.status = "Active"'];
    const queryParams: number[] = [];

    // Filter by company_id if provided and not empty - Always apply if provided (even for admin)
    // Empty string means super admin - show all users
    if (companyIdParam && companyIdParam.trim() !== '') {
      const companyId = parseInt(companyIdParam.trim());
      if (!isNaN(companyId)) {
        whereConditions.push('users.company_id = ?');
        queryParams.push(companyId);
        // When company_id is provided, show all users of that company (even for admin)
        // Don't filter by user_id - we want all users from the company
      }
    } else {
      // If no company_id provided, only show current user (for safety)
      // Skip for admin users with user_id = 1
      if (currentUserId && !isNaN(currentUserId) && currentUserId !== 1) {
        whereConditions.push('users.user_id = ?');
        queryParams.push(currentUserId);
      }
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : 'WHERE users.status = "Active"';

    const [rows] = await connection.query<User[]>(`
      SELECT 
        users.*,
        user_category.category_name AS user_category_name,
        taluka.name AS taluka_name,
        village.name AS village_name,
        grampanchayat.marathi_name AS grampanchayat_name,
        company.id AS company_id,
        company.name AS company_name
      FROM users
      LEFT JOIN user_category ON users.user_category_id = user_category.user_category_id
      LEFT JOIN taluka ON users.taluka_id = taluka.taluka_id
      LEFT JOIN village ON users.village_id = village.village_id
      LEFT JOIN grampanchayat ON users.gp_id = grampanchayat.id
      LEFT JOIN company ON users.company_id = company.id
      ${whereClause};
    `, queryParams);

    // Type-safe mapping
    const safeUsers = rows.map(({ ...user }) => user);

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}


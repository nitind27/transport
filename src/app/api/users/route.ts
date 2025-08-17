// app/api/users/route.ts
import { NextResponse } from 'next/server';
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
  status: number | string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query<User[]>(`
      SELECT 
        users.*,
        user_category.category_name AS user_category_name,
        taluka.name AS taluka_name,
        village.name AS village_name,
        grampanchayat.marathi_name AS grampanchayat_name
      FROM users
      LEFT JOIN user_category ON users.user_category_id = user_category.user_category_id
      LEFT JOIN taluka ON users.taluka_id = taluka.taluka_id
      LEFT JOIN village ON users.village_id = village.village_id
      LEFT JOIN grampanchayat ON users.gp_id = grampanchayat.id
      WHERE users.status = "Active";
    `);

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


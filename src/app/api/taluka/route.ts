// app/api/taluka/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// -------------------- GET Method --------------------
export async function GET(request: Request) {
    let connection;
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const companyId = searchParams.get('company_id');
        const categoryId = searchParams.get('category_id');

        // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
        let userFilter = '';
        const userParams: string[] = [];
        if (userId && userId.trim() !== '' && userId !== '1') {
            userFilter = 'AND taluka.user_id = ?';
            userParams.push(userId.trim());
        }

        // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId && companyId.trim() !== '') {
            companyFilter = 'AND taluka.company_id = ?';
            companyParams.push(companyId.trim());
        }

        // Build WHERE clause for category_id filtering - Filter by logged-in user's category_id
        let categoryFilter = '';
        let categoryJoin = '';
        const categoryParams: string[] = [];
        if (categoryId && categoryId.trim() !== '' && categoryId !== '5') {
            // Skip category filter for Super Admin (category_id = 5)
            categoryJoin = 'INNER JOIN users u ON taluka.user_id = u.user_id AND u.status = "Active"';
            categoryFilter = 'AND u.user_category_id = ?';
            categoryParams.push(categoryId.trim());
        }

        // Combine all parameters
        const allParams = [...userParams, ...companyParams, ...categoryParams];

        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT 
      taluka.*, 
      district.name AS districtname
   FROM taluka
   INNER JOIN district ON taluka.dist_id = district.district_id
   ${categoryJoin}
   WHERE taluka.status = "Active"
   ${userFilter}
   ${companyFilter}
   ${categoryFilter}`,
            allParams
        );


        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query failed (GET):', error);
        return NextResponse.json(
            { message: 'Failed to fetch taluka' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// -------------------- POST Method (Insert) --------------------
export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { name, name_en, dist_id, status, company_id, user_id } = body;

        // Basic Validation
        if (!name) {
            return NextResponse.json(
                { message: 'Taluka name and district ID are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO taluka (name, name_en, dist_id, status, company_id, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, name_en, dist_id, status || 'Active', company_id || null, user_id || null]
        );

        return NextResponse.json({
            message: 'Taluka added successfully',
            taluka_id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add taluka' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}



export async function PATCH(request: Request) {
    const { taluka_id, status } = await request.json();

    if (!taluka_id || !status) {
        return NextResponse.json({ error: 'Scheme ID and status are required' }, { status: 400 });
    }

    try {
        await pool.query(
            'UPDATE taluka SET status = ? WHERE taluka_id = ?',
            [status, taluka_id]
        );
        return NextResponse.json({ message: `Scheme ${status === 'active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { taluka_id, name, name_en } = body;

        if (!taluka_id) {
            return NextResponse.json({ message: 'Taluka ID is required' }, { status: 400 });
        }

        // Build dynamic query parts for only those fields that are provided
        const fieldsToUpdate = [];
        const values = [];

        if (name) {
            fieldsToUpdate.push('name = ?');
            values.push(name);
        }
        if (name_en) {
            fieldsToUpdate.push('name_en = ?');
            values.push(name_en);
        }


        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        // Add taluka_id for WHERE clause
        values.push(taluka_id);

        connection = await pool.getConnection();
        const query = `UPDATE taluka SET ${fieldsToUpdate.join(', ')} WHERE taluka_id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Taluka updated successfully' });
    } catch (error) {
        console.error('Taluka update failed:', error);
        return NextResponse.json({ message: 'Failed to update taluka' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

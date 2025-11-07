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

        // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
        let userFilter = '';
        const userParams: string[] = [];
        if (userId && userId.trim() !== '' && userId !== '1') {
            userFilter = 'AND district.user_id = ?';
            userParams.push(userId.trim());
        }

        // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId && companyId.trim() !== '') {
            companyFilter = 'AND district.company_id = ?';
            companyParams.push(companyId.trim());
        }

        // Combine all parameters
        const allParams = [...userParams, ...companyParams];

        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM district WHERE status = "Active"
            ${userFilter}
            ${companyFilter}`,
            allParams
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query failed (GET):', error);
        return NextResponse.json(
            { message: 'Failed to fetch district' },
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
        const { name, name_en, status, company_id, user_id } = body;

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO district (name, name_en, status, company_id, user_id) VALUES (?, ?, ?, ?, ?)',
            [name, name_en, status || 'Active', company_id || null, user_id || null]
        );

        return NextResponse.json({
            message: 'District added successfully',
            district_id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add district' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}



export async function PATCH(request: Request) {
    const { district_id, status } = await request.json();

    if (!district_id || !status) {
        return NextResponse.json({ error: 'Scheme ID and status are required' }, { status: 400 });
    }

    try {
        await pool.query(
            'UPDATE district SET status = ? WHERE district_id = ?',
            [status, district_id]
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
        const { district_id, name, name_en } = body;

        if (!district_id) {
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

        // Add district_id for WHERE clause
        values.push(district_id);

        connection = await pool.getConnection();
        const query = `UPDATE district SET ${fieldsToUpdate.join(', ')} WHERE district_id = ?`;
   
        await connection.query(query, values);

        return NextResponse.json({ message: 'Taluka updated successfully' });
    } catch (error) {
        console.error('Taluka update failed:', error);
        return NextResponse.json({ message: 'Failed to update taluka' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

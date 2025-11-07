import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// --- GET Method ---
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
            userFilter = 'AND dealer.user_id = ?';
            userParams.push(userId.trim());
        }

        // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId && companyId.trim() !== '') {
            companyFilter = 'AND dealer.company_id = ?';
            companyParams.push(companyId.trim());
        }

        // Combine all parameters
        const allParams = [...userParams, ...companyParams];

        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM dealer WHERE status = "Active"
            ${userFilter}
            ${companyFilter}`,
            allParams
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query failed (GET):', error);
        return NextResponse.json(
            { message: 'Failed to fetch dealer data' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// --- POST Method (Insert) ---
export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { name, contactnumber, address, gstno, status, company_id, user_id } = body;

        // Basic Validation
        if (!name || !contactnumber || !address || !gstno) {
            return NextResponse.json(
                { message: 'All fields (name, contactnumber, address, gstno) are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO dealer (name, contactnumber, address, gstno, status, company_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, contactnumber, address, gstno, status || 'Active', company_id || null, user_id || null]
        );

        return NextResponse.json({
            message: 'Dealer data added successfully',
            id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add dealer data' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// --- PATCH Method (Status Update) ---
export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
        }

        await pool.query(
            'UPDATE dealer SET status = ? WHERE id = ?',
            [status, id]
        );
        return NextResponse.json({ message: `Dealer status ${status === 'Active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

// --- PUT Method (Update) ---
export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { id, name, contactnumber, address, gstno } = body;

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        const fieldsToUpdate = [];
        const values = [];

        if (name) {
            fieldsToUpdate.push('name = ?');
            values.push(name);
        }
        if (contactnumber) {
            fieldsToUpdate.push('contactnumber = ?');
            values.push(contactnumber);
        }
        if (address) {
            fieldsToUpdate.push('address = ?');
            values.push(address);
        }
        if (gstno) {
            fieldsToUpdate.push('gstno = ?');
            values.push(gstno);
        }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        values.push(id);

        connection = await pool.getConnection();
        const query = `UPDATE dealer SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Dealer data updated successfully' });
    } catch (error) {
        console.error('Dealer update failed:', error);
        return NextResponse.json({ message: 'Failed to update dealer data' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// --- GET Method ---
export async function GET(req: Request) {
    let connection;
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        connection = await pool.getConnection();
        
        if (id) {
            // Fetch single company by ID
            const [rows] = await connection.query<RowDataPacket[]>(
                `SELECT * FROM company WHERE id = ? AND status = "Active"`,
                [id]
            );
            return NextResponse.json(rows.length > 0 ? rows[0] : null);
        } else {
            // Fetch all active companies (existing behavior)
            const [rows] = await connection.query<RowDataPacket[]>(
                `SELECT * FROM company WHERE status = "Active"`
            );
            return NextResponse.json(rows);
        }
    } catch (error) {
        console.error('Database query failed (GET):', error);
        return NextResponse.json(
            { message: 'Failed to fetch company data' },
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
        const { name, contactnumber, address, gstno, status } = body;

        // Basic Validation
        if (!name || !contactnumber || !address || !gstno) {
            return NextResponse.json(
                { message: 'All fields (name, contactnumber, address, gstno) are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO company (name, contactnumber, address, gstno, status) VALUES (?, ?, ?, ?, ?)',
            [name, contactnumber, address, gstno, status || 'Active']
        );

        return NextResponse.json({
            message: 'Company data added successfully',
            id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add company data' },
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
            'UPDATE company SET status = ? WHERE id = ?',
            [status, id]
        );
        return NextResponse.json({ message: `Company status ${status === 'Active' ? 'activated' : 'deactivated'}` });
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
        const query = `UPDATE company SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Company data updated successfully' });
    } catch (error) {
        console.error('Company update failed:', error);
        return NextResponse.json({ message: 'Failed to update company data' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

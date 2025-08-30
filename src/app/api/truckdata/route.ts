// app/api/truckdata/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// -------------------- GET Method --------------------
export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT * FROM truckdata WHERE status = "Active"`
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query failed (GET):', error);
        return NextResponse.json(
            { message: 'Failed to fetch truck data' },
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
        const { truckNo, ownerId, ownerName, mobileNumber, status } = body;

        // Basic Validation
        if (!truckNo || !ownerId) {
            return NextResponse.json(
                { message: 'Truck number and owner ID are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO truckdata (truckNo, ownerId, ownerName, mobileNumber, status) VALUES (?, ?, ?, ?, ?)',
            [truckNo, ownerId, ownerName, mobileNumber, status || 'Active']
        );

        return NextResponse.json({
            message: 'Truck data added successfully',
            id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add truck data' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}


// -------------------- PATCH Method (Status Update) --------------------
export async function PATCH(request: Request) {
    const { id, status } = await request.json();

    if (!id || !status) {
        return NextResponse.json({ error: 'Truck ID and status are required' }, { status: 400 });
    }

    try {
        await pool.query(
            'UPDATE truckdata SET status = ? WHERE id = ?',
            [status, id]
        );
        return NextResponse.json({ message: `Truck status ${status === 'Active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}


// -------------------- PUT Method (Update) --------------------
export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { id, truckNo, ownerId, ownerName, mobileNumber } = body;

        if (!id) {
            return NextResponse.json({ message: 'Truck ID is required' }, { status: 400 });
        }

        // Build dynamic query parts for only those fields that are provided
        const fieldsToUpdate = [];
        const values = [];

        if (truckNo) {
            fieldsToUpdate.push('truckNo = ?');
            values.push(truckNo);
        }
        if (ownerId) {
            fieldsToUpdate.push('ownerId = ?');
            values.push(ownerId);
        }
        if (ownerName) {
            fieldsToUpdate.push('ownerName = ?');
            values.push(ownerName);
        }
        if (mobileNumber) {
            fieldsToUpdate.push('mobileNumber = ?');
            values.push(mobileNumber);
        }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        // Add id for WHERE clause
        values.push(id);

        connection = await pool.getConnection();
        const query = `UPDATE truckdata SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Truck data updated successfully' });
    } catch (error) {
        console.error('Truck update failed:', error);
        return NextResponse.json({ message: 'Failed to update truck data' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

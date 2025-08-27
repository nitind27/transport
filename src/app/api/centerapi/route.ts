// app/api/centerapi/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface CenterRow {
    center_id: number;
    name: string;
    name_en?: string;
    marathi_name?: string;
    taluka_id?: number;
    dist_id?: number;
    status?: string;
}

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[] & CenterRow[]>(`
          SELECT c.*, 
                 t.name AS talukaname,
                 d.name AS districtname
          FROM centerdata c
          LEFT JOIN taluka t ON c.taluka_id = t.taluka_id
          LEFT JOIN district d ON c.dist_id = d.district_id
          WHERE c.status = "Active"
        `);

        const safeCenters = (rows as CenterRow[]).map(({ ...row }) => row);
        return NextResponse.json(safeCenters);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch centers' },
            { status: 500 }
        );
    }
}

// -------------------- POST Method (Insert) --------------------
export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { taluka_id, center_id, name, marathi_name, dist_id, status } = body;

        if (!taluka_id || !dist_id || !name || !marathi_name) {
            return NextResponse.json(
                { message: 'taluka_id, dist_id, name, marathi_name are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO centerdata (taluka_id, center_id, name, marathi_name, dist_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [taluka_id, center_id ?? null, name, marathi_name, dist_id, status ?? 'Active']
        );

        return NextResponse.json({
            message: 'Center added successfully',
            center_id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add center' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

export async function PATCH(request: Request) {
    const { center_id, status } = await request.json();

    if (!center_id || !status) {
        return NextResponse.json({ error: 'center_id and status are required' }, { status: 400 });
    }

    try {
        await pool.query(
            'UPDATE centerdata SET status = ? WHERE center_id = ?',
            [status, center_id]
        );
        return NextResponse.json({ message: `Center ${status === 'Active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { center_id, taluka_id, dist_id, name, marathi_name, status } = body;

        if (!center_id) {
            return NextResponse.json({ message: 'center_id is required' }, { status: 400 });
        }

        const fieldsToUpdate: string[] = [];
        const values: (string | number)[] = [];

        if (typeof taluka_id !== 'undefined' && taluka_id !== '') {
            fieldsToUpdate.push('taluka_id = ?');
            values.push(taluka_id);
        }
        if (typeof dist_id !== 'undefined' && dist_id !== '') {
            fieldsToUpdate.push('dist_id = ?');
            values.push(dist_id);
        }
        if (typeof name !== 'undefined') {
            fieldsToUpdate.push('name = ?');
            values.push(name);
        }
        if (typeof marathi_name !== 'undefined') {
            fieldsToUpdate.push('marathi_name = ?');
            values.push(marathi_name);
        }
        if (typeof status !== 'undefined') {
            fieldsToUpdate.push('status = ?');
            values.push(status);
        }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        values.push(center_id);

        connection = await pool.getConnection();
        const query = `UPDATE centerdata SET ${fieldsToUpdate.join(', ')} WHERE center_id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Center updated successfully' });
    } catch (error) {
        console.error('Center update failed:', error);
        return NextResponse.json({ message: 'Failed to update center' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
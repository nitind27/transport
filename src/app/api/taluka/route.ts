// app/api/taluka/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// -------------------- GET Method --------------------
export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
       const [rows] = await connection.query<RowDataPacket[]>(
  `SELECT 
      taluka.*, 
      district.name AS districtname
   FROM taluka
   INNER JOIN district ON taluka.dist_id = district.district_id
   WHERE taluka.status = "Active"`
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
        const { name, name_en, dist_id, status } = body;

        // Basic Validation
        if (!name) {
            return NextResponse.json(
                { message: 'Taluka name and district ID are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO taluka (name, name_en, dist_id, status) VALUES (?, ?, ?, ?)',
            [name, name_en, dist_id, status || 'Active']
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

// app/api/villages/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface Village {
    village_id: number;
    name: string;
}

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[] & Village[]>(`SELECT * FROM village where status = "Active"`);


        const safeVillages = (rows as Village[]).map(({ ...village }) => village);

        return NextResponse.json(safeVillages);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch villages' },
            { status: 500 }
        );
    }
}




// -------------------- POST Method (Insert) --------------------
export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { taluka_id, village_id, name, marathi_name } = body;

        // Basic Validation
        if (!taluka_id) {
            return NextResponse.json(
                { message: 'Taluka name and district ID are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO village (taluka_id, village_id, name, marathi_name, status) VALUES (?, ?, ?, ?, ?)',
            [taluka_id, village_id, name, marathi_name, 'Active']
        );

        return NextResponse.json({
            message: 'Village added successfully',
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




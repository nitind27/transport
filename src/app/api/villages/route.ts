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
        const [rows] = await pool.query<RowDataPacket[] & Village[]>(`SELECT 
      village.*, 
      taluka.name AS talukaname,
          district.name AS districtname
   FROM village
   INNER JOIN taluka ON village.taluka_id = taluka.taluka_id
   INNER JOIN district ON village.dist_id = district.district_id
   WHERE village.status = "Active"`);

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
        const { taluka_id, village_id, name, marathi_name, dist_id, status } = body;

        if (!taluka_id || !dist_id || !name || !marathi_name) {
            return NextResponse.json(
                { message: 'taluka_id, dist_id, name, marathi_name are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO village (taluka_id, village_id, name, marathi_name, dist_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [taluka_id, village_id ?? null, name, marathi_name, dist_id, status ?? 'Active']
        );

        return NextResponse.json({
            message: 'Village added successfully',
            village_id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add village' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

export async function PATCH(request: Request) {
    const { village_id, status } = await request.json();

    if (!village_id || !status) {
        return NextResponse.json({ error: 'village_id and status are required' }, { status: 400 });
    }

    try {
        await pool.query(
            'UPDATE village SET status = ? WHERE village_id = ?',
            [status, village_id]
        );
        return NextResponse.json({ message: `Village ${status === 'Active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { village_id, taluka_id, dist_id, name, marathi_name, status } = body;

        if (!village_id) {
            return NextResponse.json({ message: 'village_id is required' }, { status: 400 });
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

        values.push(village_id);

        connection = await pool.getConnection();
        const query = `UPDATE village SET ${fieldsToUpdate.join(', ')} WHERE village_id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Village updated successfully' });
    } catch (error) {
        console.error('Village update failed:', error);
        return NextResponse.json({ message: 'Failed to update village' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
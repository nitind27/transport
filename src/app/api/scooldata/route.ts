// app/api/schooldata/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ScoolRow {
    schoolid: number;
    name: string;
    dist: number;
    taluka: number;
    village: number;
    center: number;
    udais_no: string;
    status?: string;
    districtname?: string;
    talukaname?: string;
    villagename?: string;
    centername?: string;
}

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[] & ScoolRow[]>(`
            SELECT s.*, 
                   d.name AS districtname,
                   t.name AS talukaname,
                   v.marathi_name AS villagename,
                   c.marathi_name AS centername
            FROM schooldata s
            LEFT JOIN district d ON s.district = d.district_id 
            LEFT JOIN taluka t ON s.taluka_id = t.taluka_id
            LEFT JOIN village v ON s.village_id = v.village_id
            LEFT JOIN centerdata c ON s.center = c.center_id
            WHERE s.status = "Active"
        `);

        return NextResponse.json(rows as ScoolRow[]);
    } catch (error) {
        console.error('Database query failed (GET schooldata):', error);
        return NextResponse.json(
            { message: 'Failed to fetch schooldata' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { schoolname, district, taluka_id, village_id, center, udaisno, mobile1, mobile2, mobile3, status, company_id, user_id } = body;
        if (!schoolname || !district || !taluka_id || !village_id || !center || !udaisno) {
          return NextResponse.json(
            { message: 'schoolname, district, taluka_id, village_id, center, udais_no are required' },
            { status: 400 }
          );
        }
        
        connection = await pool.getConnection();
        const [result] = await connection.query<ResultSetHeader>(
          'INSERT INTO schooldata (schoolname, district, taluka_id, village_id, center, udaisno, mobile1, mobile2, mobile3, status, company_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [schoolname, district, taluka_id, village_id, center, udaisno, mobile1 ?? null, mobile2 ?? null, mobile3 ?? null, status ?? 'Active', company_id || null, user_id || null]
        );

        return NextResponse.json({
            message: 'School added successfully',
            id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST schooldata):', error);
        return NextResponse.json(
            { message: 'Failed to add school' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { schoolid, schoolname, district, taluka_id, village_id, center, udaisno, mobile1, mobile2, mobile3, status } = body;

        if (!schoolid) {
            return NextResponse.json({ message: 'id is required' }, { status: 400 });
        }

        const fieldsToUpdate: string[] = [];
        const values: (string | number | null)[] = [];

        if (typeof schoolname !== 'undefined') { fieldsToUpdate.push('schoolname = ?'); values.push(schoolname); }
        if (typeof district !== 'undefined' && district !== '') { fieldsToUpdate.push('district = ?'); values.push(district); }
        if (typeof taluka_id !== 'undefined' && taluka_id !== '') { fieldsToUpdate.push('taluka_id = ?'); values.push(taluka_id); }
        if (typeof village_id !== 'undefined' && village_id !== '') { fieldsToUpdate.push('village_id = ?'); values.push(village_id); }
        if (typeof center !== 'undefined' && center !== '') { fieldsToUpdate.push('center = ?'); values.push(center); }
        if (typeof udaisno !== 'undefined') { fieldsToUpdate.push('udaisno = ?'); values.push(udaisno); }
        // if (typeof class_1_5 !== 'undefined') { fieldsToUpdate.push('class_1_5 = ?'); values.push(class_1_5 ?? null); }
        // if (typeof class_6_8 !== 'undefined') { fieldsToUpdate.push('class_6_8 = ?'); values.push(class_6_8 ?? null); }
        if (typeof mobile1 !== 'undefined') { fieldsToUpdate.push('mobile1 = ?'); values.push(mobile1 ?? null); }
        if (typeof mobile2 !== 'undefined') { fieldsToUpdate.push('mobile2 = ?'); values.push(mobile2 ?? null); }
        if (typeof mobile3 !== 'undefined') { fieldsToUpdate.push('mobile3 = ?'); values.push(mobile3 ?? null); }
        if (typeof status !== 'undefined') { fieldsToUpdate.push('status = ?'); values.push(status); }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        values.push(schoolid);

        connection = await pool.getConnection();
        const query = `UPDATE schooldata SET ${fieldsToUpdate.join(', ')} WHERE schoolid  = ?`;
        await connection.query(query, values);

        return NextResponse.json({ message: 'School updated successfully' });
    } catch (error) {
        console.error('Database update failed (PUT schooldata):', error);
        return NextResponse.json({ message: 'Failed to update school' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
export async function PATCH(req: Request) {
    try {
        const { id, status } = await req.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
        }

        await pool.query('UPDATE schooldata SET status = ? WHERE schoolid = ?', [status, id]);
        return NextResponse.json({ message: `School ${status === 'Active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error (PATCH schooldata):', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    let connection;
    try {
        const { searchParams } = new URL(req.url);
        const idParam = searchParams.get('id');
        const id = idParam ? Number(idParam) : null;

        if (!id) {
            return NextResponse.json({ message: 'id is required' }, { status: 400 });
        }

        connection = await pool.getConnection();
        const [result] = await connection.query<ResultSetHeader>('DELETE FROM schooldata WHERE schoolid = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'School not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'School deleted successfully' });
    } catch (error) {
        console.error('Database delete failed (DELETE schooldata):', error);
        return NextResponse.json({ message: 'Failed to delete school' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}



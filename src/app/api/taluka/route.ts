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
            'SELECT * FROM taluka WHERE status = "Active"'
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
        const { Taluka,entaluka, status } = body;

        // Basic Validation
        if (!Taluka) {
            return NextResponse.json(
                { message: 'Taluka name and district ID are required' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();

        const [result] = await connection.query<ResultSetHeader>(
            'INSERT INTO taluka (name, name_en, status) VALUES (?, ?, ?)',
            [Taluka, entaluka, status || 'Active']
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

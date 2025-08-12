// app/api/taluka/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM grampanchayat where status = "Active"');

        // Type-safe mapping (optional - now properly typed)
        const safeUsers = rows.map((user) => user);

        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch grampanchayat' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// app/api/villages/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

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



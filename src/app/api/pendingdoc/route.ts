import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const [rows] = await pool.query(`
            SELECT 
                farmers.*,
                taluka.name AS taluka_name,
                village.name AS village_name
            FROM farmers
            LEFT JOIN taluka 
                ON farmers.taluka_id = taluka.taluka_id
            LEFT JOIN village 
                ON farmers.village_id = village.village_id
            WHERE farmers.status = 'Active' 
            AND farmers.documents = ''
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

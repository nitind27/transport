import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        t.taluka_id,
        t.name,
        t.name_en,
        COUNT(DISTINCT s.schoolid) AS total_schools,
        COUNT(DISTINCT dd.school_id) AS distributed_schools,
        (COUNT(DISTINCT s.schoolid) - COUNT(DISTINCT dd.school_id)) AS remaining_schools
      FROM taluka t
      LEFT JOIN schooldata s ON t.taluka_id = s.taluka_id AND s.status = 'Active'
      LEFT JOIN dispatch_details dd ON s.schoolid = dd.school_id AND dd.status = 'Active'
      WHERE t.status = 'Active'
      GROUP BY t.taluka_id, t.name, t.name_en
      ORDER BY t.name
    `);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch taluka dashboard data' }, { status: 500 });
  }
}
import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// Get all schemes
export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM scheme_sub_category where status = "Active"');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error); // Use the error variable
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

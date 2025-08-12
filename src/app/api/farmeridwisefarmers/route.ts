import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const farmerIdStr = formData.get('farmer_id')?.toString().trim();

    if (!farmerIdStr) {
      return NextResponse.json({ error: 'farmer_id is required' }, { status: 400 });
    }

    // Split and sanitize IDs
    const farmerIds = farmerIdStr
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^\d+$/.test(id)); // keep only numeric ids

    if (farmerIds.length === 0) {
      return NextResponse.json({ error: 'No valid farmer IDs provided' }, { status: 400 });
    }

    const placeholders = farmerIds.map(() => '?').join(', ');
    const query = `SELECT * FROM farmers_new WHERE farmer_id IN (${placeholders}) AND status = "Active"`;

    const [rows] = await pool.query<RowDataPacket[]>(query, farmerIds);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No matching farmers found' }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

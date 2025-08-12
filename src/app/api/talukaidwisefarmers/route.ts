import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    // Parse form-data from the request
    const formData = await request.formData();
    const taluka_id = formData.get('taluka_id');

    if (!taluka_id) {
      return NextResponse.json({ error: 'taluka_id is required' }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM  farmers WHERE taluka_id = ? AND status = "Active"',
      [taluka_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Farmer not found' }, { status: 404 });
    }

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

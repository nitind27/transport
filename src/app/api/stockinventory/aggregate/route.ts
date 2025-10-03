import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>(
      `
      SELECT
        ig.name AS grain,
        ig.Unit AS units,
        COALESCE(SUM(si.weight), 0) AS totalQuantity
      FROM itemsgrains ig
      LEFT JOIN stockinventory si
        ON LOWER(TRIM(si.grain)) = LOWER(TRIM(ig.name))
        AND si.status = 'Active'
      WHERE ig.status = 'Active'
      GROUP BY ig.id, ig.name, ig.Unit
      ORDER BY ig.name ASC
      `
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Aggregate query failed:', error);
    return NextResponse.json({ message: 'Failed to fetch aggregate totals' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
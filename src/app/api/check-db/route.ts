import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

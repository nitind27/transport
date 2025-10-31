import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        'UPDATE users SET loginstatus = 0 WHERE user_id = ?',
        [user_id]
      );

      if (Array.isArray(result) && result.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Login status flushed successfully',
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Flush login status error:', error);
    return NextResponse.json(
      { error: 'Failed to flush login status' },
      { status: 500 }
    );
  }
}

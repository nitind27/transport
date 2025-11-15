import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

interface SessionRow extends RowDataPacket {
  is_active: number;
}

export async function GET(req: Request) {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const deviceId = searchParams.get('device_id');

    if (!userId || !deviceId) {
      return NextResponse.json(
        { message: 'User ID and Device ID are required' },
        { status: 400 }
      );
    }

    // Get current user from cookie to verify
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token');
    
    if (!authToken) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentUserId = parseInt(authToken.value);
    const requestedUserId = parseInt(userId);
    
    // Verify that the user_id matches the current logged-in user
    if (currentUserId !== requestedUserId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if this device's session is still active
    connection = await pool.getConnection();
    
    // Check session in user_sessions table
    const [sessions] = await connection.query<SessionRow[]>(
      `SELECT is_active FROM user_sessions WHERE user_id = ? AND device_id = ?`,
      [requestedUserId, deviceId]
    );

    // If no session found or session is inactive, user is logged out
    if (!Array.isArray(sessions) || sessions.length === 0 || sessions[0].is_active === 0) {
      connection.release();
      return NextResponse.json({
        loginstatus: 0,
        isLoggedIn: false,
        sessionActive: false
      });
    }

    // Also check users table for backward compatibility
    const [users] = await connection.query(
      `SELECT loginstatus FROM users WHERE user_id = ?`,
      [requestedUserId]
    );
    connection.release();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0] as { loginstatus: number };

    return NextResponse.json({
      loginstatus: user.loginstatus,
      isLoggedIn: user.loginstatus === 1,
      sessionActive: true
    });

  } catch (error) {
    if (connection) connection.release();
    console.error('Check session error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


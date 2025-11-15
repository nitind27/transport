import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { RowDataPacket } from 'mysql2';

interface CountRow extends RowDataPacket {
  count: number;
}

export async function POST(req: Request) {
  let connection;
  try {
    const { user_id, device_id_to_logout } = await req.json();

    if (!user_id || !device_id_to_logout) {
      return NextResponse.json(
        { message: 'User ID and device ID to logout are required' },
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
    
    // Verify that the user_id matches the current logged-in user
    if (currentUserId !== user_id) {
      return NextResponse.json(
        { message: 'Unauthorized: Cannot logout other users' },
        { status: 403 }
      );
    }

    connection = await pool.getConnection();
    
    // Deactivate the specific device session
    await connection.query(
      `UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND device_id = ?`,
      [user_id, device_id_to_logout]
    );
    
    // Check if there are any other active sessions for this user
    const [activeSessions] = await connection.query<CountRow[]>(
      `SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND is_active = 1`,
      [user_id]
    );
    
    const hasOtherActiveSessions = activeSessions[0]?.count > 0;
    
    // Only update loginstatus if no other active sessions exist (and not superadmin)
    if (!hasOtherActiveSessions && user_id !== 1) {
      await connection.query(
        `UPDATE users SET loginstatus = 0 WHERE user_id = ?`,
        [user_id]
      );
    }
    
    connection.release();

    return NextResponse.json({
      message: 'Other device logged out successfully',
      success: true
    });

  } catch (error) {
    if (connection) connection.release();
    console.error('Logout other device error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


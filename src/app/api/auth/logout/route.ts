import { NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface CountRow extends RowDataPacket {
  count: number;
}

export async function POST(req: Request) {
  let connection;
  try {
    // Get device_id from request body
    const { device_id } = await req.json();
    
    // Get user_id from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token');
    
    if (authToken && device_id) {
      const user_id = parseInt(authToken.value);
      
      // Update session to inactive for this specific device
      if (!isNaN(user_id)) {
        connection = await pool.getConnection();
        
        // Deactivate session for this device
        await connection.query(
          `UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND device_id = ?`,
          [user_id, device_id]
        );
        
        // Check if there are any other active sessions for this user
        const [activeSessions] = await connection.query<CountRow[]>(
          `SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ? AND is_active = 1`,
          [user_id]
        );
        
        const hasOtherActiveSessions = activeSessions[0]?.count > 0;
        
        // Only update loginstatus to 0 if no other active sessions exist
        if (!hasOtherActiveSessions && user_id !== 1) {
          await connection.query(
            `UPDATE users SET loginstatus = 0, device_id = NULL WHERE user_id = ?`,
            [user_id]
          );
        }
        
        connection.release();
      }
    }

    // Create expired cookie (category_id is in sessionStorage, cleared client-side)
    const cookie = serialize('auth_token', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0), // Immediate expiration
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', cookie);
    return response;

  } catch (error) {
    if (connection) connection.release();
    console.error('Logout error:', error);
    
    // Even if database update fails, clear the cookie (category_id is in sessionStorage)
    const cookie = serialize('auth_token', '', {
      httpOnly: true,
      path: '/',
      expires: new Date(0),
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    response.headers.set('Set-Cookie', cookie);
    return response;
  }
}

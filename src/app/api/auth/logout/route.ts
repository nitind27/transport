import { NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function POST() {
  let connection;
  try {
    // Get user_id from cookie
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token');
    
    if (authToken) {
      const user_id = parseInt(authToken.value);
      
      // Update loginstatus to 0 (logged out) in database
      if (!isNaN(user_id)) {
        connection = await pool.getConnection();
        await connection.query(
          `UPDATE users SET loginstatus = 0 WHERE user_id = ?`,
          [user_id]
        );
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

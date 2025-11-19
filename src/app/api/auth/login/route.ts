import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { serialize } from 'cookie'; // npm install cookie
import { RowDataPacket } from 'mysql2';

// Reuse or define this interface if not already present
interface User {
  user_id: number;
  name: string;
  user_category_id: number;
  username: string;
  password: string;
  contact_no: string;
  address: string;
  category_name: string;
  taluka_id: number;
  village_id: number;
  company_id?: number | null;
  status: string;
  loginstatus?: number; // Add loginstatus field
  created_at: Date;
  updated_at: Date;
}

export async function POST(req: Request) {
  let connection;
  try {
    const { username, password, isAdminLogin, company_id, device_id } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Ensure isAdminLogin is a proper boolean
    const adminLoginFlag = isAdminLogin === true || isAdminLogin === "true" || String(isAdminLogin).toLowerCase() === "true";
    
    console.log('Login API Called:', {
      username: username,
      isAdminLogin: isAdminLogin,
      adminLoginFlag: adminLoginFlag,
      company_id: company_id
    });

    connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT users.*, user_category.category_name 
       FROM users 
       INNER JOIN user_category ON users.user_category_id = user_category.user_category_id  
       WHERE users.username = ?`,
      [username]
    );

    if (!Array.isArray(users) || users.length === 0) {
      connection.release();
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = users[0] as User;

    if (password !== user.password) {
      connection.release();
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Validate company_id if not admin login
    if (!adminLoginFlag) {
      // If company_id is provided in request, validate it matches user's company_id
      if (company_id) {
        const userCompanyId = user.company_id ? Number(user.company_id) : null;
        const requestedCompanyId = Number(company_id);
        
        if (userCompanyId !== requestedCompanyId) {
          connection.release();
          console.error('Company ID Mismatch:', {
            username: username,
            userCompanyId: userCompanyId,
            requestedCompanyId: requestedCompanyId
          });
          return NextResponse.json(
            { message: 'Invalid credentials. Username and password do not belong to the selected company.' },
            { status: 401 }
          );
        }
      } else {
        // If company_id is required but not provided, reject login
        connection.release();
        return NextResponse.json(
          { message: 'Company selection is required for login.' },
          { status: 400 }
        );
      }
    }

    console.log('User Found:', {
      username: user.username,
      user_category_id: user.user_category_id,
      adminLoginFlag: adminLoginFlag
    });

    // Check if admin login is restricted to category_id 5 (Super Admin)
    // // Only validate if adminLoginFlag is true
    // if (adminLoginFlag && user.user_category_id !== 5) {
    //   connection.release();
    //   console.error('Admin Login Validation Failed:', {
    //     isAdminLogin: adminLoginFlag,
    //     userCategoryId: user.user_category_id,
    //     expectedCategoryId: 5
    //   });
    //   return NextResponse.json(
    //     { 
    //       message: 'Invalid credentials. Admin login is only allowed for Super Admin users (category_id = 5).',
    //       debug: {
    //         isAdminLogin: adminLoginFlag,
    //         userCategoryId: user.user_category_id,
    //         username: username,
    //         expectedCategoryId: 5
    //       }
    //     },
    //     { status: 401 }
    //   );
    // }

    // Check if device_id is provided
    if (!device_id) {
      connection.release();
      return NextResponse.json(
        { message: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Check if user is already logged in on a different device
    // First, check if there's an existing session for this user with a different device_id
    let hasExistingSession = false;
    let existingDeviceId: string | null = null;
    
    interface SessionRow extends RowDataPacket {
      device_id: string;
    }
    
    // Check for existing sessions in user_sessions table (including user_id = 1)
    const [existingSessions] = await connection.query<SessionRow[]>(
      `SELECT device_id FROM user_sessions WHERE user_id = ? AND is_active = 1`,
      [user.user_id]
    );

    if (Array.isArray(existingSessions) && existingSessions.length > 0) {
      // Check if any session is from a different device
      const differentDeviceSession = existingSessions.find(
        (session: SessionRow) => session.device_id !== device_id
      );
      
      if (differentDeviceSession) {
        hasExistingSession = true;
        existingDeviceId = differentDeviceSession.device_id;
      }
    }

    // Create or update session in user_sessions table (including user_id = 1)
    // First, deactivate any existing session for this device_id and user_id
    await connection.query(
      `UPDATE user_sessions SET is_active = 0 WHERE user_id = ? AND device_id = ?`,
      [user.user_id, device_id]
    );

    // Insert new session or reactivate existing one
    // Try INSERT first, if it fails due to duplicate, use UPDATE
    try {
      await connection.query(
        `INSERT INTO user_sessions (user_id, device_id, is_active, login_time, last_activity)
         VALUES (?, ?, 1, NOW(), NOW())`,
        [user.user_id, device_id]
      );
    } catch (insertError: unknown) {
      // If duplicate key error, update instead
      const error = insertError as { code?: string; errno?: number };
      if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        await connection.query(
          `UPDATE user_sessions 
           SET is_active = 1, login_time = NOW(), last_activity = NOW()
           WHERE user_id = ? AND device_id = ?`,
          [user.user_id, device_id]
        );
      } else {
        throw insertError;
      }
    }

    // Also update loginstatus in users table for backward compatibility (including user_id = 1)
    await connection.query(
      `UPDATE users SET loginstatus = 1, device_id = ? WHERE user_id = ?`,
      [device_id, user.user_id]
    );

    connection.release();

    // Set a cookie with user info
    const cookie = serialize('auth_token', String(user.user_id), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    const isSuperAdmin = adminLoginFlag && user.user_category_id === 5;
    
    console.log('Login Successful:', {
      username: user.username,
      category_id: user.user_category_id,
      isSuperAdmin: isSuperAdmin
    });

    const response = NextResponse.json({
      message: 'Login successful',
      hasExistingSession: hasExistingSession, // Flag to indicate if user was already logged in on another device
      existingDeviceId: existingDeviceId, // Device ID of the other active session
      user: { 
        name: user.name, 
        user_id: user.user_id, 
        category_name: user.category_name, 
        taluka_id: user.taluka_id, 
        village_id: user.village_id, 
        category_id: user.user_category_id,
        isSuperAdmin: isSuperAdmin
      }
    });
    response.headers.set('Set-Cookie', cookie);

    return response;

  } catch (error) {
    if (connection) connection.release();
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

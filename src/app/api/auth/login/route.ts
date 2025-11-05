import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { serialize } from 'cookie'; // npm install cookie

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
  status: string;
  loginstatus?: number; // Add loginstatus field
  created_at: Date;
  updated_at: Date;
}

export async function POST(req: Request) {
  let connection;
  try {
    const { username, password, isAdminLogin } = await req.json();

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
      adminLoginFlag: adminLoginFlag
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

    // Check if user is already logged in (loginstatus = 1)
    if (user.loginstatus === 1) {
      connection.release();
      return NextResponse.json(
        { message: 'User is already logged in. Please logout from other device/session first.' },
        { status: 403 }
      );
    }

    // Update loginstatus to 1 (logged in)
    await connection.query(
      `UPDATE users SET loginstatus = 1 WHERE user_id = ?`,
      [user.user_id]
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

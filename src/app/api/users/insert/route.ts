import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { RowDataPacket } from 'mysql2';
import { sendUserCredentialsEmail } from '@/lib/email';

// Define the User type to match your database schema
interface User {
  user_id?: number; // Auto-incremented, so optional for inserts
  name: string;
  user_category_id?: number | null;
  username: string;
  password: string;
  contact_no: string;
  email?: string | null;
  address?: string | null;
  gp_id?: number | null;
  company_id?: number | null;
  status?: string | null;
}

interface MySQLError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

export async function POST(request: Request) {
  try {
    const {
      name,
      user_category_id,
      username,
      password,
      contact_no,
      email,
      address,
      gp_id,
      company_id,
      status
    } = await request.json();

    // Basic validation
    if (!name || !username || !password || !contact_no || !email) {
      return NextResponse.json(
        { error: 'Required fields: name, username, password, contact_no, email' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Database operation
    try {
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO users (
          name,
          user_category_id,
          username,
          password,
          contact_no,
          email,
          address,
          gp_id,
          company_id,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          user_category_id,
          username,
          password,
          contact_no,
          email,
          address,
          gp_id,
          company_id,
          status
        ]
      );

      const insertId = result.insertId;

      // Send email with credentials (only for new users)
      try {
        const emailResult = await sendUserCredentialsEmail(
          email,
          name,
          username,
          password
        );

        if (!emailResult.success) {
          console.error('Failed to send email:', emailResult.error);
          // Don't fail the request if email fails, just log it
          // User is still created successfully
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Continue even if email fails
      }

      return NextResponse.json({
        success: true,
        userId: insertId,
        emailSent: true,
      });
    } catch (error: unknown) {
      console.error('Database error:', error);
      
      // Check for duplicate email or username
      if (error instanceof Error && 'code' in error) {
        const mysqlError = error as MySQLError;
        if (mysqlError.code === 'ER_DUP_ENTRY') {
          if (mysqlError.message.includes('email')) {
            return NextResponse.json(
              { error: 'Email already exists' },
              { status: 409 }
            );
          } else if (mysqlError.message.includes('username')) {
            return NextResponse.json(
              { error: 'Username already exists' },
              { status: 409 }
            );
          }
        }
      }
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[] &User[]>(`
        SELECT 
          user_id,
          name,
          user_category_id,
          username,
          contact_no,
          email,
          address,
          gp_id,
          status
        FROM users WHERE status = "Active"
      `);
      return NextResponse.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request) {
  try {
    const {
      user_id,
      name,
      user_category_id,
      username,
      password,
      contact_no,
      email,
      address,
      gp_id,
      company_id,
      status
    } = await request.json();

    // Enhanced validation
    if (!user_id || !name || !username || !password || !contact_no || !email) {
      return NextResponse.json(
        { error: 'Required fields: user_id, name, username, password, contact_no, email' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    try {
      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE users SET
          name = ?,
          user_category_id = ?,
          username = ?,
          password = ?,
          contact_no = ?,
          email = ?,
          address = ?,
          gp_id = ?,
          company_id = ?,
          status = ?
        WHERE user_id = ?`,
        [
          name,
          user_category_id,
          username,
          password,
          contact_no,
          email,
          address,
          gp_id,
          company_id,
          status,
          user_id
        ]
      );

      if (result.affectedRows === 0) {
        return NextResponse.json(
          { error: 'User not found or no changes made' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
      });
    } catch (error: unknown) {
      console.error('Database error:', error);
      
      // Check for duplicate email or username
      if (error instanceof Error && 'code' in error) {
        const mysqlError = error as MySQLError;
        if (mysqlError.code === 'ER_DUP_ENTRY') {
          if (mysqlError.message.includes('email')) {
            return NextResponse.json(
              { error: 'Email already exists' },
              { status: 409 }
            );
          } else if (mysqlError.message.includes('username')) {
            return NextResponse.json(
              { error: 'Username already exists' },
              { status: 409 }
            );
          }
        }
      }
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request parsing error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}


export async function DELETE(request: Request) {
  const { user_id } = await request.json();

  if (!user_id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    await pool.query('DELETE FROM users WHERE user_id  = ?', [user_id]);
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Deletion failed:', error);
    return NextResponse.json({ error: 'Failed to delete scheme' }, { status: 500 });
  }
}



export async function PATCH(request: Request) {
  const { user_id, status } = await request.json();

  if (!user_id || !status) {
    return NextResponse.json({ error: 'Scheme ID and status are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE users SET status = ? WHERE user_id = ?',
      [status, user_id]
    );
    return NextResponse.json({ message: `Scheme ${status === 'active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
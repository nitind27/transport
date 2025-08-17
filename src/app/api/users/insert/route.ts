import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { RowDataPacket } from 'mysql2';

// Define the User type to match your database schema
interface User {
  user_id?: number; // Auto-incremented, so optional for inserts
  name: string;
  user_category_id?: number | null;
  username: string;
  password: string;
  contact_no: string;
  address?: string | null;
  gp_id?: number | null;
  status?: string | null;
}

export async function POST(request: Request) {
  try {
    const {
      name,
      user_category_id,
      username,
      password,
      contact_no,
      address,
      gp_id,
      status
    } = await request.json();

    // Basic validation
    if (!name || !username || !password || !contact_no) {
      return NextResponse.json(
        { error: 'Required fields: name, username, password, contact_no' },
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
          address,
       
          gp_id,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          user_category_id,
          username,
          password,
          contact_no,
          address,
        
          gp_id,
          status
        ]
      );

      const insertId = result.insertId;

      return NextResponse.json({
        success: true,
        userId: insertId,
      });
    } catch (error) {
      console.error('Database error:', error);
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
      address,
      gp_id,
      status
    } = await request.json();

    // Enhanced validation
    if (!user_id || !name || !username || !password || !contact_no) {
      return NextResponse.json(
        { error: 'Required fields: user_id, name, username, password, contact_no' },
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
          address = ?,
          gp_id = ?,
          status = ?
        WHERE user_id = ?`,
        [
          name,
          user_category_id,
          username,
          password,
          contact_no,
          address,
          gp_id,
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
    } catch (error) {
      console.error('Database error:', error);
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
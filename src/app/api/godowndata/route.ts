import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface OwnerRow {
  id: number;
  name: string;
  status?: string;
}

export async function GET(request: Request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const companyId = searchParams.get('company_id');

    // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
    let userFilter = '';
    const userParams: string[] = [];
    if (userId && userId.trim() !== '' && userId !== '1') {
      userFilter = 'AND godown.user_id = ?';
      userParams.push(userId.trim());
    }

    // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
    let companyFilter = '';
    const companyParams: string[] = [];
    if (companyId && companyId.trim() !== '') {
      companyFilter = 'AND godown.company_id = ?';
      companyParams.push(companyId.trim());
    }

    // Combine all parameters
    const allParams = [...userParams, ...companyParams];

    connection = await pool.getConnection();
    const [rows] = await pool.query<RowDataPacket[] & OwnerRow[]>(
      `SELECT * FROM godown WHERE status = "Active"
      ${userFilter}
      ${companyFilter}`,
      allParams
    );
    return NextResponse.json(rows as OwnerRow[]);
  } catch (error) {
    console.error('Database query failed (GET godown):', error);
    return NextResponse.json(
      { message: 'Failed to fetch godown' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const { name, status, company_id, user_id } = body;

    if (!name) {
      return NextResponse.json(
        { message: 'name is required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO godown (name, status, company_id, user_id) VALUES (?, ?, ?, ?)',
      [name, status ?? 'Active', company_id || null, user_id || null]
    );

    return NextResponse.json({
      message: 'Godown added successfully',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Database insert failed (POST godown):', error);
    return NextResponse.json(
      { message: 'Failed to add godown' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const { id, name, status } = body;

    if (!id) {
      return NextResponse.json({ message: 'id is required' }, { status: 400 });
    }

    const fieldsToUpdate: string[] = [];
    const values: (string | number)[] = [];

    if (typeof name !== 'undefined') { fieldsToUpdate.push('name = ?'); values.push(name); }
    if (typeof status !== 'undefined') { fieldsToUpdate.push('status = ?'); values.push(status); }
    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    values.push(id);

    connection = await pool.getConnection();
    const query = `UPDATE godown SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await connection.query(query, values);

    return NextResponse.json({ message: 'Owner updated successfully' });
  } catch (error) {
    console.error('Database update failed (PUT godown):', error);
    return NextResponse.json({ message: 'Failed to update owner' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    await pool.query('UPDATE godown SET status = ? WHERE id = ?', [status, id]);
    return NextResponse.json({ message: `Owner ${status === 'Active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error (PATCH godown):', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let connection;
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const id = idParam ? Number(idParam) : null;

    if (!id) {
      return NextResponse.json({ message: 'id is required' }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [result] = await connection.query<ResultSetHeader>('DELETE FROM ownerdata WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Owner not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Owner deleted successfully' });
  } catch (error) {
    console.error('Database delete failed (DELETE ownerdata):', error);
    return NextResponse.json({ message: 'Failed to delete owner' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}


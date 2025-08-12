import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Get all schemes
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
  SELECT 
        schemes.*, 
        scheme_year.year AS scheme_year
      FROM schemes
      LEFT JOIN scheme_year 
        ON schemes.scheme_year_id = scheme_year.scheme_year_id
      WHERE schemes.status = 'Active'
    `);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// Create new scheme
export async function POST(request: Request) {
  const {

    scheme_year_id,
    scheme_name,

    scheme_name_marathi,
  } = await request.json();

  // Basic validation
  if (

    scheme_year_id === undefined ||
    !scheme_name

  ) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO schemes 
      ( scheme_year_id, scheme_name, scheme_name_marathi)
      VALUES (?, ?, ?)`,
      [

        scheme_year_id,
        scheme_name,
        scheme_name_marathi
      ]
    );
    return NextResponse.json({ message: 'Scheme created', id: result.insertId });
  } catch (error) {
    console.error('Creation failed:', error);
    return NextResponse.json({ error: 'Failed to create scheme' }, { status: 500 });
  }
}

// Update scheme
export async function PUT(request: Request) {
  const {
    scheme_id,

    scheme_year_id,
    scheme_name,

    scheme_name_marathi
  } = await request.json();

  if (
    !scheme_id ||

    scheme_year_id === undefined ||
    !scheme_name

  ) {
    return NextResponse.json({ error: 'All fields including ID are required' }, { status: 400 });
  }

  try {
    await pool.query(
      `UPDATE schemes SET
        scheme_year_id = ?,
        scheme_name = ?,
        scheme_name_marathi = ?
      WHERE scheme_id = ?`,
      [

        scheme_year_id,
        scheme_name,

        scheme_name_marathi,
        scheme_id
      ]
    );
    return NextResponse.json({ message: 'Scheme updated' });
  } catch (error) {
    console.error('Update failed:', error);
    return NextResponse.json({ error: 'Failed to update scheme' }, { status: 500 });
  }
}

// Delete scheme
export async function DELETE(request: Request) {
  const { scheme_id } = await request.json();

  if (!scheme_id) {
    return NextResponse.json({ error: 'Scheme ID is required' }, { status: 400 });
  }

  try {
    await pool.query('DELETE FROM schemes WHERE scheme_id  = ?', [scheme_id]);
    return NextResponse.json({ message: 'Scheme deleted' });
  } catch (error) {
    console.error('Deletion failed:', error);
    return NextResponse.json({ error: 'Failed to delete scheme' }, { status: 500 });
  }
}



export async function PATCH(request: Request) {
  const { scheme_id, status } = await request.json();

  if (!scheme_id || !status) {
    return NextResponse.json({ error: 'Scheme ID and status are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE schemes SET status = ? WHERE scheme_id = ?',
      [status, scheme_id]
    );
    return NextResponse.json({ message: `Scheme ${status === 'active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
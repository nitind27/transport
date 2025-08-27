import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface ItemGrainRow {
  id: number;
  name: string;
  Unit: string;
  status?: string;
}

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[] & ItemGrainRow[]>(
      'SELECT * FROM itemsgrains WHERE status = "Active"'
    );
    return NextResponse.json(rows as ItemGrainRow[]);
  } catch (error) {
    console.error('Database query failed (GET itemsgrains):', error);
    return NextResponse.json(
      { message: 'Failed to fetch itemsgrains' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    const { name, Unit, status } = body;

    if (!name || !Unit) {
      return NextResponse.json(
        { message: 'name and Unit are required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO itemsgrains (name, Unit, status) VALUES (?, ?, ?)',
      [name, Unit, status ?? 'Active']
    );

    return NextResponse.json({
      message: 'Item/Grain added successfully',
      id: result.insertId,
    });
  } catch (error) {
    console.error('Database insert failed (POST itemsgrains):', error);
    return NextResponse.json(
      { message: 'Failed to add item/grain' },
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
    const { id, name, Unit } = body;

    if (!id) {
      return NextResponse.json({ message: 'id is required' }, { status: 400 });
    }

    const fieldsToUpdate: string[] = [];
    const values: (string | number)[] = [];

    if (typeof name !== 'undefined') { fieldsToUpdate.push('name = ?'); values.push(name); }
    if (typeof Unit !== 'undefined') { fieldsToUpdate.push('Unit = ?'); values.push(Unit); }
    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
    }

    values.push(id);

    connection = await pool.getConnection();
    const query = `UPDATE itemsgrains SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    await connection.query(query, values);

    return NextResponse.json({ message: 'Item/Grain updated successfully' });
  } catch (error) {
    console.error('Database update failed (PUT itemsgrains):', error);
    return NextResponse.json({ message: 'Failed to update item/grain' }, { status: 500 });
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

    await pool.query('UPDATE itemsgrains SET status = ? WHERE id = ?', [status, id]);
    return NextResponse.json({ message: `Item/Grain ${status === 'Active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error (PATCH itemsgrains):', error);
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
    const [result] = await connection.query<ResultSetHeader>('DELETE FROM itemsgrains WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Item/Grain not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item/Grain deleted successfully' });
  } catch (error) {
    console.error('Database delete failed (DELETE itemsgrains):', error);
    return NextResponse.json({ message: 'Failed to delete item/grain' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
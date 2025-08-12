import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Get all categories
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM user_category where status = "Active"');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// Create new category
export async function POST(request: Request) {
  const { category_name } = await request.json();
  
  if (!category_name) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO user_category (category_name) VALUES (?)',
      [category_name]
    );
    return NextResponse.json({ message: 'Category created', id: result.insertId });
  } catch (error) {
    console.error('Creation error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// Update category
export async function PUT(request: Request) {
  const { user_category_id, category_name } = await request.json();
  
  if (!user_category_id || !category_name) {
    return NextResponse.json({ error: 'Both ID and category name are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE user_category SET category_name = ? WHERE user_category_id = ?',
      [category_name, user_category_id]
    );
    return NextResponse.json({ message: 'Category updated' });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// Delete category
export async function DELETE(request: Request) {
  const { user_category_id } = await request.json();
  
  if (!user_category_id) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    await pool.query('DELETE FROM user_category WHERE user_category_id = ?', [user_category_id]);
    return NextResponse.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}


// Update category status (activate/deactivate)
export async function PATCH(request: Request) {
  const { user_category_id, status } = await request.json();

  if (!user_category_id || !status) {
    return NextResponse.json({ error: 'Category ID and status are required' }, { status: 400 });
  }

  try {
    await pool.query(
      'UPDATE user_category SET status = ? WHERE user_category_id = ?',
      [status, user_category_id]
    );
    return NextResponse.json({ message: `Category ${status === 'active' ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

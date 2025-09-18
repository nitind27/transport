import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

// POST - insert a group unique id once per import
export async function POST(request: Request) {
  try {
    const { group_id, meta } = await request.json();

    if (!group_id) {
      return NextResponse.json(
        { error: 'group_id is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO uniq_id (group_id, meta) VALUES (?, ?)`,
      [group_id, meta ? JSON.stringify(meta) : null]
    );

    return NextResponse.json({ id: result.insertId, group_id });
  } catch (error) {
    console.error('uniq_id insert error:', error);
    return NextResponse.json({ error: 'Failed to insert uniq_id' }, { status: 500 });
  }
}
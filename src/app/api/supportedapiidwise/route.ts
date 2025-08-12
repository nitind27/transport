import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  try {
    // Parse form-data from the request
    const formData = await request.formData();
    const document_id = formData.get('document_id');

    if (!document_id) {
      return NextResponse.json({ error: 'document_id is required' }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM supported_documents WHERE document_id = ? AND status = "Active"',
      [document_id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

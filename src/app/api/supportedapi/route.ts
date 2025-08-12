import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

// Get all documents
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`SELECT 
                sd.*, 
                d.document_name AS document_name 
            FROM 
                supported_documents sd
            JOIN 
                documents d 
            ON 
                sd.document_id = d.id
            WHERE 
                sd.status = "Active"`);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// Create new document category
export async function POST(request: Request) {
    const { document_id, info, supported_docs, link } = await request.json();

    if (!document_id) {
        return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
    }

    try {
        const [result] = await pool.query<ResultSetHeader>(
            'INSERT INTO supported_documents (document_id,info,supported_docs,link) VALUES (?, ?, ?, ?)',
            [document_id, info, supported_docs, link]
        );
        return NextResponse.json({ message: 'Document category created', id: result.insertId });
    } catch (error) {
        console.error('Creation error:', error);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }
}

// Update document category
// Update document category
export async function PUT(request: Request) {
    const { supported_id, document_id, info, supported_docs, link } = await request.json();

    if (!supported_id || !document_id) {
        return NextResponse.json(
            { error: 'Both ID and document ID are required' },
            { status: 400 }
        );
    }

    try {
        await pool.query(
            `UPDATE supported_documents 
            SET document_id = ?, info = ?, supported_docs = ?, link = ?
            WHERE supported_id = ?`,
            [document_id, info, supported_docs, link, supported_id]
        );
        return NextResponse.json({ message: 'Document category updated' });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        );
    }
}


// Delete document category
export async function DELETE(request: Request) {
    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    try {
        await pool.query('DELETE FROM documents WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Document category deleted' });
    } catch (error) {
        console.error('Deletion error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}


export async function PATCH(request: Request) {
    const { supported_id, status } = await request.json();
    if (!supported_id || !status) {
        return NextResponse.json({ error: 'documents ID and status are required' }, { status: 400 });
    }
    try {
        await pool.query(
            'UPDATE supported_documents SET status = ? WHERE supported_id = ?',
            [status, supported_id]
        );
        return NextResponse.json({ message: `documents ${status === 'active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}



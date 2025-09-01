import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// GET - Fetch all ZP order details
export async function GET() {
    try {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM zp_order_details where status = "Active"');
      return NextResponse.json(rows);
    } catch (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
  }
  

// POST - Create new ZP order detail
export async function POST(request: Request) {
    try {
        const { order_no, no_of_days, period } = await request.json();

        // Validation
        if (!order_no || !no_of_days || !period) {
            return NextResponse.json(
                { error: 'Order No, No of Days, and Period are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO zp_order_details (order_no, no_of_days, period, status) 
       VALUES (?, ?, ?, 'Active')`,
            [order_no, no_of_days, period]
        );

        return NextResponse.json({
            message: 'ZP order detail created successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create ZP order detail' },
            { status: 500 }
        );
    }
}

// PUT - Update ZP order detail
export async function PUT(request: Request) {
    try {
        const { id, order_no, no_of_days, period } = await request.json();

        // Validation
        if (!id || !order_no || !no_of_days || !period) {
            return NextResponse.json(
                { error: 'ID, Order No, No of Days, and Period are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE zp_order_details 
       SET order_no = ?, no_of_days = ?, period = ?, updated_at = NOW()
       WHERE id = ?`,
            [order_no, no_of_days, period, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'ZP order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'ZP order detail updated successfully'
        });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'Failed to update ZP order detail' },
            { status: 500 }
        );
    }
}

// PATCH - Toggle status (soft delete)
export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json(
                { error: 'ID and status are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE zp_order_details 
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'ZP order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json(
            { error: 'Failed to update status' },
            { status: 500 }
        );
    }
}

// DELETE - Hard delete (optional)
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM zp_order_details WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'ZP order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'ZP order detail deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete ZP order detail' },
            { status: 500 }
        );
    }
}

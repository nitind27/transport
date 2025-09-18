import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// GET - Fetch all school-wise order details
export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                swo.*,
                zod.order_no,
                zod.no_of_days,
                zod.period,
                zod.financial_year,
                sd.schoolname,
                sd.udaisno
            FROM school_wise_order_details swo
            LEFT JOIN zp_order_details zod ON swo.order_id = zod.id
            LEFT JOIN schooldata sd ON swo.school_id = sd.schoolid
            WHERE swo.status = 'Active'
            ORDER BY swo.created_at DESC
        `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

// POST - Create new school-wise order detail
// POST - Create new school-wise order detail
export async function POST(request: Request) {
    try {
        const { order_id, school_id, class_range, items_data, total_weight, patsankhya, uniq_id } = await request.json();

        if (!order_id || !school_id || !class_range || !items_data) {
            return NextResponse.json(
                { error: 'Order ID, School ID, Class Range, and Items Data are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO school_wise_order_details (order_id, school_id, class_range, patsankhya, items_data, total_weight, uniq_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
            [order_id, school_id, class_range, Number(patsankhya) || 0, JSON.stringify(items_data), total_weight || 0, uniq_id || null]
        );

        return NextResponse.json({ message: 'School-wise order detail created successfully', id: result.insertId });
    } catch (error) {
        console.error('Creation error:', error);
        return NextResponse.json({ error: 'Failed to create school-wise order detail' }, { status: 500 });
    }


}

// PUT - Update school-wise order detail
export async function PUT(request: Request) {
    try {
        const { id, order_id, school_id, class_range, items_data, total_weight, patsankhya } = await request.json();

        if (!id || !order_id || !school_id || !class_range || !items_data) {
            return NextResponse.json(
                { error: 'ID, Order ID, School ID, Class Range, and Items Data are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE school_wise_order_details 
             SET order_id = ?, school_id = ?, class_range = ?, patsankhya = ?, items_data = ?, total_weight = ?, updated_at = NOW()
             WHERE id = ?`,
            [order_id, school_id, class_range, Number(patsankhya) || 0, JSON.stringify(items_data), total_weight || 0, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'School-wise order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'School-wise order detail updated successfully'
        });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'Failed to update school-wise order detail' },
            { status: 500 }
        );
    }
}

// PATCH - Toggle status (soft delete) - supports single id OR group_id bulk
// PATCH - Toggle status (soft delete) - supports single id OR uniq_id bulk
export async function PATCH(request: Request) {
    try {
        const { id, status, uniq_id } = await request.json();

        if ((!id && !uniq_id) || !status) {
            return NextResponse.json({ error: 'ID or uniq_id and status are required' }, { status: 400 });
        }

        if (uniq_id) {
            const [result] = await pool.query<ResultSetHeader>(
                `UPDATE school_wise_order_details 
                 SET status = ?, updated_at = NOW()
                 WHERE uniq_id = ?`,
                [status, uniq_id]
            );
            return NextResponse.json({ message: 'Status updated for group successfully', affected: result.affectedRows });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE school_wise_order_details 
             SET status = ?, updated_at = NOW()
             WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'School-wise order detail not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
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
            'DELETE FROM school_wise_order_details WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'School-wise order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'School-wise order detail deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete school-wise order detail' },
            { status: 500 }
        );
    }
}
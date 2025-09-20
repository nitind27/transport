import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

function generateDispatchCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT d.*,
             z.order_no,
             z.period,
             z.no_of_days,
             z.financial_year,
             s.schoolname,
             c.name AS center_name,
             t.truckNo
      FROM dispatch_details d
      LEFT JOIN zp_order_details z ON d.order_id = z.id
      LEFT JOIN schooldata s ON d.school_id = s.schoolid
      LEFT JOIN centerdata c ON d.center_id = c.center_id
      LEFT JOIN truckdata t ON d.truck_id = t.id
      WHERE d.status = 'Active'
      ORDER BY d.created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to fetch dispatch' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { order_id, school_id, center_id, truck_id, class_range, lines } = body as {
      order_id: number;
      school_id: number;
      center_id: number;
      truck_id: number;
      class_range?: string;
      lines: Array<{ grain: string; unit: string; totalQty: number; qtyDispatch: number }>;
    };

    if (!order_id || !school_id || !center_id || !truck_id || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const code = generateDispatchCode();
    await conn.beginTransaction();

    for (const l of lines) {
      const bal = Math.max(0, Number(l.totalQty) - Number(l.qtyDispatch || 0));
      await conn.query<ResultSetHeader>(
        `INSERT INTO dispatch_details
         (dispatch_code, order_id, school_id, center_id, truck_id, class_range, item_name, unit, total_qty, qty_dispatch, bal_qty, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [code, order_id, school_id, center_id, truck_id, class_range || null, l.grain, l.unit || '', Number(l.totalQty) || 0, Number(l.qtyDispatch) || 0, bal]
      );
    }

    await conn.commit();
    return NextResponse.json({ message: 'Dispatch saved', dispatch_code: code });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return NextResponse.json({ message: 'Failed to save dispatch' }, { status: 500 });
  } finally {
    conn.release();
  }
}

export async function PUT(req: Request) {
  try {
    const { id, qty_dispatch } = await req.json();
    if (!id || typeof qty_dispatch === 'undefined') {
      return NextResponse.json({ message: 'id and qty_dispatch required' }, { status: 400 });
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT total_qty FROM dispatch_details WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const total = Number(rows[0].total_qty) || 0;
    const bal = Math.max(0, total - Number(qty_dispatch));

    const [res] = await pool.query<ResultSetHeader>(
      `UPDATE dispatch_details
       SET qty_dispatch = ?, bal_qty = ?, updated_at = NOW()
       WHERE id = ?`,
      [Number(qty_dispatch), bal, id]
    );
    if (res.affectedRows === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Updated' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to update' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) return NextResponse.json({ message: 'id and status required' }, { status: 400 });

    const [res] = await pool.query<ResultSetHeader>(
      `UPDATE dispatch_details SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    if (res.affectedRows === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Status updated' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });
    const [res] = await pool.query<ResultSetHeader>('DELETE FROM dispatch_details WHERE id = ?', [id]);
    if (res.affectedRows === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Deleted' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
  }
}
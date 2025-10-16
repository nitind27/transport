import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/lib/db';
import { generateDispatchCode } from '@/lib/dispatchCodeGenerator';
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
SELECT d.*,
       z.order_no,
       z.period,
       z.no_of_days,
       z.financial_year,
       s.schoolname,
       s.taluka_id,   
       s.udaisno,
       ta.name AS taluka_name,
       c.marathi_name AS center_name,
       t.truckNo,
       MAX(sh.patsankhya) as patsankhya
FROM dispatch_details d
LEFT JOIN zp_order_details z ON d.order_id = z.id
LEFT JOIN schooldata s ON d.school_id = s.schoolid
LEFT JOIN taluka ta ON s.taluka_id = ta.taluka_id
LEFT JOIN centerdata c ON d.center_id = c.center_id
LEFT JOIN truckdata t ON d.truck_id = t.id
LEFT JOIN school_wise_order_details sh ON d.school_id = sh.school_id
WHERE d.status = 'Active'
GROUP BY d.id, d.dispatch_code, d.item_name, d.school_id, d.center_id, d.truck_id, d.order_id, d.unit, d.total_qty, d.qty_dispatch, d.new_qty_dispatch, d.dispatch_return, d.bal_qty, d.status, d.created_at, d.updated_at, d.class_range, z.order_no, z.period, z.no_of_days, z.financial_year, s.schoolname, s.taluka_id, s.udaisno, ta.name, c.marathi_name, t.truckNo
ORDER BY d.created_at DESC;

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
      lines: Array<{ grain: string; unit: string; totalQty: number; qtyDispatch: number; return_qty: number }>;
    };

    if (!order_id || !school_id || !center_id || !truck_id || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const code = await generateDispatchCode();
    await conn.beginTransaction();

    const insertedDispatchIds: number[] = [];

    // Insert dispatch details and collect IDs
    for (const l of lines) {
      const bal = Math.max(0, Number(l.totalQty) - Number(l.qtyDispatch || 0) - Number(l.return_qty || 0));
      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO dispatch_details
         (dispatch_code, order_id, school_id, center_id, truck_id, class_range, item_name, unit, total_qty, qty_dispatch, new_qty_dispatch, dispatch_return, bal_qty, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
        [code, order_id, school_id, center_id, truck_id, class_range || null, l.grain, l.unit || '', Number(l.totalQty) || 0, Number(l.qtyDispatch) || 0, Number(l.qtyDispatch) || 0, Number(l.return_qty) || 0, bal]
      );
      
      insertedDispatchIds.push(result.insertId);
    }

    await conn.commit();
    
    // Return only dispatch details, route_paper will be handled separately
    return NextResponse.json({ 
      message: 'Dispatch saved', 
      dispatch_code: code,
      dispatch_ids: insertedDispatchIds
    });
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
    const { id, qty_dispatch, return_qty, new_qty_dispatch } = await req.json();
    if (!id) {
      return NextResponse.json({ message: 'id is required' }, { status: 400 });
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT total_qty, qty_dispatch FROM dispatch_details WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const total = Number(rows[0].total_qty) || 0;
    const originalDispatched = Number(rows[0].qty_dispatch) || 0;
    
    // Use provided values or keep existing values
    const dispatched = typeof qty_dispatch !== 'undefined' ? Number(qty_dispatch) : originalDispatched;
    const returned = typeof return_qty !== 'undefined' ? Number(return_qty) : 0;
    const newDispatched = typeof new_qty_dispatch !== 'undefined' ? Number(new_qty_dispatch) : originalDispatched;
    
    // Calculate balance: total - new_qty_dispatch
    const bal = Math.max(0, total - newDispatched);

    const [res] = await pool.query<ResultSetHeader>(
      `UPDATE dispatch_details
       SET qty_dispatch = ?, dispatch_return = ?, new_qty_dispatch = ?, bal_qty = ?, updated_at = NOW()
       WHERE id = ?`,
      [dispatched, returned, newDispatched, bal, id]
    );
    if (res.affectedRows === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ message: 'Updated successfully' });
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dispatchCode = searchParams.get('dispatch_code');

    if (!dispatchCode) {
      return NextResponse.json({ message: 'Dispatch code is required' }, { status: 400 });
    }

    // Delete all dispatch records with the given dispatch_code
    const result = await pool.query(
      'DELETE FROM dispatch_details WHERE dispatch_code = ?',
      [dispatchCode]
    );
    const [res] = result as [ResultSetHeader, unknown];

    if (!res || res.affectedRows === 0) {
      return NextResponse.json({ message: 'Dispatch not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Dispatch deleted successfully',
      deletedRows: res.affectedRows
    });

  } catch (error) {
    console.error('Error deleting dispatch:', error);
    return NextResponse.json(
      { message: 'Failed to delete dispatch' },
      { status: 500 }
    );
  }
}
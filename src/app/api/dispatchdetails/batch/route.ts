import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

interface DispatchItem {
  order_id: number;
  school_id: number;
  center_id: number;
  class_range?: string;
  lines: Array<{ grain: string; unit: string; totalQty: number; qtyDispatch: number; return_qty?: number }>;
}

export async function POST(req: Request) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { truck_id, user_id, company_id, items } = body as {
      truck_id: number;
      user_id?: string | null;
      company_id?: string | null;
      items: DispatchItem[];
    };

    if (!truck_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'truck_id and items array are required' }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.order_id || !item.school_id || !item.center_id || !Array.isArray(item.lines) || item.lines.length === 0) {
        return NextResponse.json({ message: 'Each item must have order_id, school_id, center_id, and lines' }, { status: 400 });
      }
    }

    await conn.beginTransaction();

    // Generate SINGLE dispatch_code for ALL items - INSIDE transaction with locking
    // This prevents race conditions where multiple requests get same dispatch_code
    const [dispatchMaxRows] = await conn.query<RowDataPacket[]>(
      'SELECT MAX(CAST(dispatch_code AS UNSIGNED)) as maxCode FROM dispatch_details FOR UPDATE'
    );
    const dispatchCode = String(((dispatchMaxRows && dispatchMaxRows[0]?.maxCode) ? Number(dispatchMaxRows[0].maxCode) : 0) + 1);
    
    console.log('Generated dispatch_code:', dispatchCode, 'for', items.length, 'schools');

    const insertedDispatchIds: number[] = [];

    // Convert user_id and company_id to numbers if provided
    const userIdNum = user_id && user_id.trim() !== '' ? parseInt(user_id.trim()) : null;
    const companyIdNum = company_id && company_id.trim() !== '' ? parseInt(company_id.trim()) : null;

    // Insert ALL dispatch details with the SAME dispatch_code
    for (const item of items) {
      for (const line of item.lines) {
        const bal = Math.max(0, Number(line.totalQty) - Number(line.qtyDispatch || 0) - Number(line.return_qty || 0));
        const [result] = await conn.query<ResultSetHeader>(
          `INSERT INTO dispatch_details
           (dispatch_code, order_id, school_id, center_id, truck_id, class_range, item_name, unit, total_qty, qty_dispatch, new_qty_dispatch, dispatch_return, bal_qty, user_id, company_id, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
          [
            dispatchCode,
            item.order_id,
            item.school_id,
            item.center_id,
            truck_id,
            item.class_range || null,
            line.grain,
            line.unit || 'kg',
            Number(line.totalQty) || 0,
            Number(line.qtyDispatch) || 0,
            Number(line.qtyDispatch) || 0,
            Number(line.return_qty) || 0,
            bal,
            userIdNum,
            companyIdNum
          ]
        );
        
        insertedDispatchIds.push(result.insertId);
      }
    }

    // Now create route_paper with the SAME route_number for all dispatch records
    // Using FOR UPDATE to lock and prevent race conditions
    const [maxRows] = await conn.query<RowDataPacket[]>(
      'SELECT MAX(CAST(route_number AS UNSIGNED)) AS lastNum FROM route_paper FOR UPDATE'
    );
    const routeNumber = ((maxRows && maxRows[0]?.lastNum) ? Number(maxRows[0].lastNum) : 0) + 1;
    
    console.log('Generated route_number:', routeNumber, 'for', items.length, 'schools');
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const routecode = `RP-${dateStr}-${routeNumber}`;

    // Get unique class_ranges from items
    const classRanges = [...new Set(items.map(item => item.class_range || 'Unknown'))];

    // Insert route_paper entries for each dispatch record with SAME route_number
    const insertedRoutePaperIds: number[] = [];
    for (const dispatchId of insertedDispatchIds) {
      // Get the class_range for this dispatch record
      const [dispatchDetail] = await conn.query<RowDataPacket[]>(
        'SELECT class_range FROM dispatch_details WHERE id = ?',
        [dispatchId]
      );
      const classRange = dispatchDetail[0]?.class_range || 'Unknown';

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO route_paper (dispatch_ids, status, created_at, route_number, routecode, dispatch_code, class_range, user_id, company_id)
         VALUES (?, 'Active', NOW(), ?, ?, ?, ?, ?, ?)`,
        [JSON.stringify([dispatchId]), routeNumber, routecode, dispatchCode, classRange, userIdNum, companyIdNum]
      );
      insertedRoutePaperIds.push(result.insertId);
    }

    await conn.commit();
    
    console.log(`Batch dispatch completed: dispatch_code=${dispatchCode}, route_number=${routeNumber}, schools=${items.length}`);
    
    return NextResponse.json({ 
      message: `${items.length} schools dispatched with dispatch_code: ${dispatchCode}, route_number: ${routeNumber}`,
      dispatch_code: dispatchCode,
      route_number: routeNumber,
      routecode: routecode,
      dispatch_ids: insertedDispatchIds,
      route_paper_ids: insertedRoutePaperIds,
      class_ranges: classRanges,
      total_items: items.length,
      total_dispatch_records: insertedDispatchIds.length
    });
  } catch (e) {
    await conn.rollback();
    console.error('Batch dispatch error:', e);
    return NextResponse.json({ message: 'Failed to save batch dispatch: ' + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  } finally {
    conn.release();
  }
}


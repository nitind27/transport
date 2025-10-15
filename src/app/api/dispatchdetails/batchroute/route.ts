import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export async function POST(req: Request) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { dispatch_ids } = body as {
      dispatch_ids: number[];
    };

    if (!Array.isArray(dispatch_ids) || dispatch_ids.length === 0) {
      return NextResponse.json({ message: 'dispatch_ids array is required' }, { status: 400 });
    }

    await conn.beginTransaction();

    // Get the next route number for this batch
    const [maxRows] = await conn.query<RowDataPacket[]>('SELECT MAX(route_number) AS lastNum FROM route_paper');
    const routeNumber = ((maxRows && maxRows[0]?.lastNum) ? Number(maxRows[0].lastNum) : 0) + 1;
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const routecode = `RP-${dateStr}-${routeNumber}`;

    // Group dispatch_ids by class_range
    const placeholders = dispatch_ids.map(() => '?').join(',');
    const [dispatchDetails] = await conn.query<RowDataPacket[]>(
      `SELECT id, dispatch_code, class_range FROM dispatch_details WHERE id IN (${placeholders})`,
      dispatch_ids
    );

    // Group by class_range
    const classRangeGroups = new Map<string, number[]>();
    dispatchDetails.forEach(detail => {
      const classRange = detail.class_range || 'Unknown';
      if (!classRangeGroups.has(classRange)) {
        classRangeGroups.set(classRange, []);
      }
      classRangeGroups.get(classRange)!.push(detail.id);
    });

    // Insert separate route_paper entry for each class_range
    for (const [classRange, classDispatchIds] of classRangeGroups) {
      const dispatch_code = dispatchDetails.find(d => d.id === classDispatchIds[0])?.dispatch_code || '';

      await conn.query<ResultSetHeader>(
        `INSERT INTO route_paper (dispatch_ids, status, created_at, route_number, routecode, dispatch_code, class_range)
         VALUES (?, 'Active', NOW(), ?, ?, ?, ?)`,
        [JSON.stringify(classDispatchIds), routeNumber, routecode, dispatch_code, classRange]
      );
    }

    await conn.commit();
    
    return NextResponse.json({ 
      message: 'Route Paper saved for batch with separate class ranges', 
      route_number: routeNumber,
      routecode: routecode,
      class_ranges: Array.from(classRangeGroups.keys()),
      total_entries: classRangeGroups.size
    });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return NextResponse.json({ message: 'Failed to save route paper' }, { status: 500 });
  } finally {
    conn.release();
  }
}
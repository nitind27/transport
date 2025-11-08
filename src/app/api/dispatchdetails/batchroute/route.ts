import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export async function POST(req: Request) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { dispatch_ids, user_id, company_id } = body as {
      dispatch_ids: number[];
      user_id?: string | null;
      company_id?: string | null;
    };

    if (!Array.isArray(dispatch_ids) || dispatch_ids.length === 0) {
      return NextResponse.json({ message: 'dispatch_ids array is required' }, { status: 400 });
    }

    // Convert user_id and company_id to numbers if provided
    const userIdNum = user_id && user_id.trim() !== '' ? parseInt(user_id.trim()) : null;
    const companyIdNum = company_id && company_id.trim() !== '' ? parseInt(company_id.trim()) : null;

    await conn.beginTransaction();

    // Get the next route number for this batch
    // const [maxRows] = await conn.query<RowDataPacket[]>('SELECT MAX(route_number) AS lastNum FROM route_paper');
    const [maxRows] = await conn.query<RowDataPacket[]>('SELECT MAX(CAST(route_number AS UNSIGNED)) AS lastNum FROM route_paper');
    const routeNumber = ((maxRows && maxRows[0]?.lastNum) ? Number(maxRows[0].lastNum) : 0) + 1;
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const routecode = `RP-${dateStr}-${routeNumber}`;

    // Get all dispatch details
    const placeholders = dispatch_ids.map(() => '?').join(',');
    const [dispatchDetails] = await conn.query<RowDataPacket[]>(
      `SELECT id, dispatch_code, class_range FROM dispatch_details WHERE id IN (${placeholders})`,
      dispatch_ids
    );

    console.log('Processing dispatch details:', dispatchDetails);

    const insertedRoutePaperIds: number[] = [];

    // Insert separate route_paper entry for EACH individual dispatch record
    for (const detail of dispatchDetails) {
      const dispatch_code = detail.dispatch_code || '';
      const class_range = detail.class_range || 'Unknown';
      
      // Create individual route_paper entry for each dispatch record
      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO route_paper (dispatch_ids, status, created_at, route_number, routecode, dispatch_code, class_range, user_id, company_id)
         VALUES (?, 'Active', NOW(), ?, ?, ?, ?, ?, ?)`,
        [JSON.stringify([detail.id]), routeNumber, routecode, dispatch_code, class_range, userIdNum, companyIdNum]
      );

      insertedRoutePaperIds.push(result.insertId);
      console.log(`Inserted route_paper entry for dispatch_id ${detail.id}, class_range ${class_range}:`, result.insertId);
    }

    await conn.commit();
    
    return NextResponse.json({ 
      message: 'Route Paper saved - each dispatch record has separate route_paper entry', 
      route_number: routeNumber,
      routecode: routecode,
      total_entries: insertedRoutePaperIds.length,
      processed_dispatch_ids: dispatch_ids.length,
      inserted_route_paper_ids: insertedRoutePaperIds
    });
  } catch (e) {
    await conn.rollback();
    console.error('Batch route creation error:', e);
    return NextResponse.json({ message: 'Failed to save route paper' }, { status: 500 });
  } finally {
    conn.release();
  }
}
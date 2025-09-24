import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';

type RoutePaperInput = { dispatch_ids: number[] };

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ message: 'ids query param is required' }, { status: 400 });
    }
    const ids = idsParam.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));
    if (ids.length === 0) return NextResponse.json([], { status: 200 });

    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT d.*,
             z.order_no, z.period, z.no_of_days, z.financial_year,
             s.schoolname, s.udaisno,
             c.name AS center_name, c.marathi_name AS center_name_mr,
             t.truckNo,
             sh.patsankhya
      FROM dispatch_details d
      LEFT JOIN zp_order_details z ON d.order_id = z.id
      LEFT JOIN schooldata s       ON d.school_id = s.schoolid
      LEFT JOIN centerdata c       ON d.center_id = c.center_id
      LEFT JOIN truckdata t        ON d.truck_id = t.id
   LEFT JOIN school_wise_order_details sh 
         ON d.school_id = sh.school_id
      WHERE d.id IN (${placeholders})
      ORDER BY d.created_at ASC
      `,
      ids
    );
    return NextResponse.json(rows);
  } catch (e) {
    console.error('route_paper GET error:', e);
    return NextResponse.json({ message: 'Failed to fetch dispatch rows' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let conn;
  try {
    const body = await req.json();
    const routes = (body?.routes || []) as RoutePaperInput[];
    if (!Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json({ message: 'routes array is required' }, { status: 400 });
    }

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Get last route_number from DB
    type MaxRow = RowDataPacket & { lastNum: number | null };
    const [rows] = await conn.query<MaxRow[]>('SELECT MAX(route_number) AS lastNum FROM route_paper');
    const routeNumber = ((rows && rows[0]?.lastNum) ? Number(rows[0].lastNum) : 0) + 1; // Next batch number, starts from 1 if table empty
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    for (const r of routes) {
      if (!Array.isArray(r.dispatch_ids) || r.dispatch_ids.length === 0) {
        await conn.rollback();
        return NextResponse.json({ message: 'dispatch_ids is required for each route' }, { status: 400 });
      }

      const placeholders = r.dispatch_ids.map(() => '?').join(',');
      const [dcRows] = await conn.query<RowDataPacket[]>(
        `SELECT DISTINCT dispatch_code FROM dispatch_details WHERE id IN (${placeholders})`,
        r.dispatch_ids
      );
      let dispatch_code: string | null = null;
      if (dcRows && dcRows.length > 0) {
        if (dcRows.length > 1) {
          await conn.rollback();
          return NextResponse.json({ message: 'Selected rows contain multiple dispatch_code values; please group by same dispatch_code.' }, { status: 400 });
        }
        dispatch_code = String(dcRows[0].dispatch_code || '');
      }

      const routecode = `RP-${dateStr}-${routeNumber}`;
      await conn.query<ResultSetHeader>(
        `INSERT INTO route_paper (dispatch_ids, status, created_at, route_number, routecode, dispatch_code)
         VALUES (?, 'Active', NOW(), ?, ?, ?)`,
        [JSON.stringify(r.dispatch_ids), routeNumber, routecode, dispatch_code]
      );
    }

    await conn.commit();
    return NextResponse.json({ message: 'Route paper saved', count: routes.length });
  } catch (e) {
    if (conn) try { await conn.rollback(); } catch { }
    console.error('route_paper insert error:', e);
    return NextResponse.json({ message: 'Failed to save route paper' }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}




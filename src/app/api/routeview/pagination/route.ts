import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
// import { generateDispatchCode } from '@/lib/dispatchCodeGenerator';

export async function GET(req: Request) {
  try {
    // Get query parameters from URL
    const url = new URL(req.url);
    const fromDate = url.searchParams.get('fromDate');
    const endDate = url.searchParams.get('endDate');
    const routeNumber = url.searchParams.get('routeNumber');
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const userId = url.searchParams.get('user_id');
    const companyId = url.searchParams.get('company_id');
    const categoryId = url.searchParams.get('category_id');

    console.log('Routeview pagination API - Filters:', { fromDate, endDate, routeNumber, userId, companyId, categoryId });

    // Validate YYYY-MM-DD format
    const isValidDate = (d?: string | null) => !!(d && /^\d{4}-\d{2}-\d{2}$/.test(d));

    let startDate = isValidDate(fromDate) ? fromDate! : undefined;
    let endDateFilter = isValidDate(endDate) ? endDate! : undefined;

    // Require date filters to prevent querying all records (performance safeguard)
    if (!startDate && !endDateFilter) {
      return NextResponse.json({
        message: 'Date filters (fromDate and/or endDate) are required for performance reasons'
      }, { status: 400 });
    }

    // If both present but reversed, swap
    if (startDate && endDateFilter && startDate > endDateFilter) {
      const tmp = startDate;
      startDate = endDateFilter;
      endDateFilter = tmp;
    }

    // If only one bound is provided, treat it as a single-day filter
    if (startDate && !endDateFilter) endDateFilter = startDate;
    if (!startDate && endDateFilter) startDate = endDateFilter;

    // Pagination: default 50 per page
    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.max(1, Math.min(200, Number(limitParam) || 50));
    const offset = (page - 1) * limit;

    // ========== PHASE 1: Get dispatch IDs efficiently ==========
    // Simple query with minimal joins to get dispatch IDs
    let baseWhereClause = `WHERE d.status = 'Active' AND d.created_at >= ? AND d.created_at < DATE_ADD(?, INTERVAL 1 DAY)`;
    const baseParams: (string | number)[] = [`${startDate} 00:00:00`, `${endDateFilter} 00:00:00`];

    // Add company filter using d.company_id directly (faster than COALESCE)
    if (companyId && companyId.trim() !== '') {
      baseWhereClause += ` AND (d.company_id = ? OR d.company_id IS NULL)`;
      baseParams.push(companyId.trim());
    }

    // Add route number filter
    if (routeNumber && routeNumber.trim() !== '') {
      baseWhereClause += ` AND (rp.route_number = ? OR (rp.route_number IS NULL AND d.dispatch_code = ?))`;
      baseParams.push(routeNumber.trim(), routeNumber.trim());
    }

    console.log('Phase 1 - Getting dispatch IDs with params:', baseParams);

    // Get total count first (fast query)
    const [totalRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT CONCAT(DATE(d.created_at), '_', COALESCE(rp.route_number, d.dispatch_code))) as total
       FROM dispatch_details d
       LEFT JOIN route_paper rp ON rp.dispatch_code = d.dispatch_code
       ${baseWhereClause}`,
      baseParams
    );

    const total = Number(totalRows[0]?.total || 0);
    console.log('Phase 1 - Total routes found:', total);

    // Get dispatch IDs for this page (fast query - only getting IDs)
    const [dispatchIdRows] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.dispatch_code, DATE(d.created_at) as route_date, 
              COALESCE(rp.route_number, d.dispatch_code) as route_number
       FROM dispatch_details d
       LEFT JOIN route_paper rp ON rp.dispatch_code = d.dispatch_code
       ${baseWhereClause}
       ORDER BY d.created_at DESC, d.id DESC`,
      baseParams
    );

    console.log('Phase 1 - Total dispatch records:', dispatchIdRows.length);

    if (dispatchIdRows.length === 0) {
      console.log('Phase 1 - No dispatches found, returning empty result');
      return NextResponse.json({ rows: [], total: 0, page, limit });
    }

    // Group by route_key and paginate
    const routeGroups = new Map<string, number[]>();
    for (const row of dispatchIdRows) {
      const routeKey = `${row.route_date}_${row.route_number}`;
      if (!routeGroups.has(routeKey)) {
        routeGroups.set(routeKey, []);
      }
      routeGroups.get(routeKey)!.push(row.id);
    }

    // Get paginated route keys
    const allRouteKeys = Array.from(routeGroups.keys());
    const paginatedRouteKeys = allRouteKeys.slice(offset, offset + limit);
    
    console.log('Phase 1 - Route groups:', allRouteKeys.length, 'Paginated:', paginatedRouteKeys.length);

    if (paginatedRouteKeys.length === 0) {
      return NextResponse.json({ rows: [], total: allRouteKeys.length, page, limit });
    }

    // Get dispatch IDs for paginated route keys only
    const dispatchIds: number[] = [];
    for (const routeKey of paginatedRouteKeys) {
      dispatchIds.push(...(routeGroups.get(routeKey) || []));
    }

    console.log('Phase 2 - Fetching details for', dispatchIds.length, 'dispatch IDs');

    // ========== PHASE 2: Fetch full details by dispatch IDs ==========
    if (dispatchIds.length === 0) {
      return NextResponse.json({ rows: [], total: allRouteKeys.length, page, limit });
    }

    const idPlaceholders = dispatchIds.map(() => '?').join(',');

    // Simple query - fetch by primary key IDs (very fast)
    const detailsQuery = `
      SELECT 
        d.*,
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
        COALESCE(rp.route_number, d.dispatch_code) as route_number,
        rp.class_range as route_class_range,
        DATE(d.created_at) as route_date
      FROM dispatch_details d
      LEFT JOIN zp_order_details z ON d.order_id = z.id
      LEFT JOIN schooldata s ON d.school_id = s.schoolid
      LEFT JOIN taluka ta ON s.taluka_id = ta.taluka_id
      LEFT JOIN centerdata c ON d.center_id = c.center_id
      LEFT JOIN truckdata t ON d.truck_id = t.id
      LEFT JOIN route_paper rp ON rp.dispatch_code = d.dispatch_code
      WHERE d.id IN (${idPlaceholders})
      ORDER BY d.created_at DESC, CAST(COALESCE(rp.route_number, '0') AS UNSIGNED) DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(detailsQuery, dispatchIds);

    // Fetch patsankhya separately to avoid slow join
    const schoolIds = [...new Set(rows.map(r => r.school_id).filter(Boolean))];
    const orderIds = [...new Set(rows.map(r => r.order_id).filter(Boolean))];
    
    const patsankhyaMap = new Map<string, number>();
    if (schoolIds.length > 0 && orderIds.length > 0) {
      const schoolPlaceholders = schoolIds.map(() => '?').join(',');
      const orderPlaceholders = orderIds.map(() => '?').join(',');
      
      const [patsankhyaRows] = await pool.query<RowDataPacket[]>(
        `SELECT school_id, order_id, patsankhya 
         FROM school_wise_order_details 
         WHERE school_id IN (${schoolPlaceholders}) AND order_id IN (${orderPlaceholders})`,
        [...schoolIds, ...orderIds]
      );
      
      for (const row of patsankhyaRows) {
        patsankhyaMap.set(`${row.school_id}_${row.order_id}`, row.patsankhya);
      }
    }

    // Add patsankhya to rows
    const finalRows = rows.map(row => ({
      ...row,
      patsankhya: patsankhyaMap.get(`${row.school_id}_${row.order_id}`) || null
    }));

    console.log('Phase 2 - Rows fetched:', finalRows.length);

    return NextResponse.json({ rows: finalRows, total: allRouteKeys.length, page, limit });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to fetch dispatch' }, { status: 500 });
  }
}

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

    // Get the next route number for this batch - using FOR UPDATE to prevent race conditions
    const [maxRows] = await conn.query<RowDataPacket[]>(
      'SELECT MAX(CAST(route_number AS UNSIGNED)) AS lastNum FROM route_paper FOR UPDATE'
    );
    const routeNumber = ((maxRows && maxRows[0]?.lastNum) ? Number(maxRows[0].lastNum) : 0) + 1;
    
    console.log('Generated route_number:', routeNumber);
    
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const routecode = `RP-${dateStr}-${routeNumber}`;

    // Group dispatch_ids by class_range
    const placeholders = dispatch_ids.map(() => '?').join(',');
    const [dispatchDetails] = await conn.query<RowDataPacket[]>(
      `SELECT id, dispatch_code, class_range FROM dispatch_details WHERE id IN (${placeholders})`,
      dispatch_ids
    );

    console.log('Processing dispatch details:', dispatchDetails);

    // Group by class_range
    const classRangeGroups = new Map<string, number[]>();
    dispatchDetails.forEach(detail => {
      const classRange = detail.class_range || 'Unknown';
      if (!classRangeGroups.has(classRange)) {
        classRangeGroups.set(classRange, []);
      }
      classRangeGroups.get(classRange)!.push(detail.id);
    });

    console.log('Class range groups:', Array.from(classRangeGroups.entries()));

    // Insert separate route_paper entry for each class_range
    for (const [classRange, classDispatchIds] of classRangeGroups) {
      const dispatch_code = dispatchDetails.find(d => d.id === classDispatchIds[0])?.dispatch_code || '';

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO route_paper (dispatch_ids, status, created_at, route_number, routecode, dispatch_code, class_range)
         VALUES (?, 'Active', NOW(), ?, ?, ?, ?)`,
        [JSON.stringify(classDispatchIds), routeNumber, routecode, dispatch_code, classRange]
      );

      console.log(`Inserted route_paper entry for class_range ${classRange}:`, result.insertId);
    }

    await conn.commit();
    
    return NextResponse.json({ 
      message: 'Route Paper saved for batch with separate class ranges', 
      route_number: routeNumber,
      routecode: routecode,
      class_ranges: Array.from(classRangeGroups.keys()),
      total_entries: classRangeGroups.size,
      processed_dispatch_ids: dispatch_ids.length
    });
  } catch (e) {
    await conn.rollback();
    console.error('Batch route creation error:', e);
    return NextResponse.json({ message: 'Failed to save route paper' }, { status: 500 });
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

// export async function DELETE(req: Request) {
//   try {
//     const { id } = await req.json();
//     if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });
//     const [res] = await pool.query<ResultSetHeader>('DELETE FROM dispatch_details WHERE id = ?', [id]);
//     if (res.affectedRows === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
//     return NextResponse.json({ message: 'Deleted' });
//   } catch (e) {
//     console.error(e);
//     return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
//   }
// } 

// Add this new DELETE method that handles dispatch_code
// Add this new DELETE method that handles dispatch_code
export async function DELETE(req: Request) {
  const conn = await pool.getConnection();
  try {
    const body = await req.json();
    const { id, dispatch_code } = body;
    
    if (dispatch_code) {
      // Delete by dispatch_code (delete entire route from both tables)
      await conn.beginTransaction();
      
      // Delete from route_paper table
      const [routePaperResult] = await conn.query<ResultSetHeader>(
        'DELETE FROM route_paper WHERE dispatch_code = ?', 
        [dispatch_code]
      );
      
      // Delete from dispatch_details table
      const [dispatchResult] = await conn.query<ResultSetHeader>(
        'DELETE FROM dispatch_details WHERE dispatch_code = ?', 
        [dispatch_code]
      );
      
      await conn.commit();
      
      if (dispatchResult.affectedRows === 0 && routePaperResult.affectedRows === 0) {
        return NextResponse.json({ message: 'No records found' }, { status: 404 });
      }
      
      return NextResponse.json({ 
        message: 'Route deleted successfully',
        deleted_from_dispatch_details: dispatchResult.affectedRows,
        deleted_from_route_paper: routePaperResult.affectedRows
      });
    } else if (id) {
      // Delete by individual ID (existing functionality)
      const [res] = await conn.query<ResultSetHeader>('DELETE FROM dispatch_details WHERE id = ?', [id]);
      if (res.affectedRows === 0) return NextResponse.json({ message: 'Not found' }, { status: 404 });
      return NextResponse.json({ message: 'Deleted' });
    } else {
      return NextResponse.json({ message: 'id or dispatch_code required' }, { status: 400 });
    }
  } catch (e) {
    await conn.rollback();
    console.error(e);
    return NextResponse.json({ message: 'Failed to delete' }, { status: 500 });
  } finally {
    conn.release();
  }
}
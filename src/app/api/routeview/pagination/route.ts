import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
// import { generateDispatchCode } from '@/lib/dispatchCodeGenerator';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const fromDate = url.searchParams.get('fromDate');
    const endDate = url.searchParams.get('endDate');
    const routeNumber = url.searchParams.get('routeNumber');
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const companyId = url.searchParams.get('company_id');

    const isValidDate = (d?: string | null) =>
      !!(d && /^\d{4}-\d{2}-\d{2}$/.test(d));

    let startDate = isValidDate(fromDate) ? fromDate! : undefined;
    let endDateFilter = isValidDate(endDate) ? endDate! : undefined;

    if (!startDate && !endDateFilter) {
      return NextResponse.json(
        { message: 'Date filters are required' },
        { status: 400 }
      );
    }

    if (startDate && endDateFilter && startDate > endDateFilter) {
      const tmp = startDate;
      startDate = endDateFilter;
      endDateFilter = tmp;
    }

    if (startDate && !endDateFilter) endDateFilter = startDate;
    if (!startDate && endDateFilter) startDate = endDateFilter;

    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.max(1, Math.min(200, Number(limitParam) || 50));
    const offset = (page - 1) * limit;

    // ----------------------------
    // BASE WHERE
    // ----------------------------
    let where = `
      WHERE d.status = 'Active'
      AND d.created_at >= ?
      AND d.created_at < DATE_ADD(?, INTERVAL 1 DAY)
    `;

    const params: (string | number)[] = [
      `${startDate} 00:00:00`,
      `${endDateFilter} 00:00:00`,
    ];

    if (companyId?.trim()) {
      where += ` AND d.company_id = ?`;
      params.push(companyId.trim());
    }

    if (routeNumber?.trim()) {
      where += ` AND COALESCE(rp.route_number, d.dispatch_code) = ?`;
      params.push(routeNumber.trim());
    }

    // ----------------------------
    // PHASE 1 → GET ROUTES
    // ----------------------------

    const [routeRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT DISTINCT
        DATE(d.created_at) as route_date,
        COALESCE(rp.route_number, d.dispatch_code) as route_number
      FROM dispatch_details d
      LEFT JOIN (
          SELECT dispatch_code, MAX(route_number) as route_number
          FROM route_paper
          GROUP BY dispatch_code
      ) rp ON rp.dispatch_code = d.dispatch_code
      ${where}
      ORDER BY route_date DESC, route_number DESC
      `,
      params
    );

    const totalRoutes = routeRows.length;

    const paginatedRoutes = routeRows.slice(offset, offset + limit);

    if (paginatedRoutes.length === 0) {
      return NextResponse.json({
        rows: [],
        total: totalRoutes,
        page,
        limit,
      });
    }

    // ----------------------------
    // PHASE 2 → FETCH DETAILS
    // ----------------------------

    const routeConditions: string[] = [];
    const routeParams: (string | number)[] = [];

    for (const r of paginatedRoutes) {
      routeConditions.push(
        `(DATE(d.created_at)=? AND COALESCE(rp.route_number, d.dispatch_code)=?)`
      );
      routeParams.push(r.route_date, r.route_number);
    }

    const detailQuery = `
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
        DATE(d.created_at) as route_date
      FROM dispatch_details d
      LEFT JOIN zp_order_details z ON d.order_id = z.id
      LEFT JOIN schooldata s ON d.school_id = s.schoolid
      LEFT JOIN taluka ta ON s.taluka_id = ta.taluka_id
      LEFT JOIN centerdata c ON d.center_id = c.center_id
      LEFT JOIN truckdata t ON d.truck_id = t.id
      LEFT JOIN (
          SELECT dispatch_code, MAX(route_number) as route_number
          FROM route_paper
          GROUP BY dispatch_code
      ) rp ON rp.dispatch_code = d.dispatch_code
      WHERE ${routeConditions.join(' OR ')}
      ORDER BY d.created_at DESC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(
      detailQuery,
      routeParams
    );

    // ----------------------------
    // FETCH PATSANKHYA
    // ----------------------------

    const schoolIds = [...new Set(rows.map(r => r.school_id).filter(Boolean))];
    const orderIds = [...new Set(rows.map(r => r.order_id).filter(Boolean))];

    const patsankhyaMap = new Map<string, number>();

    if (schoolIds.length > 0 && orderIds.length > 0) {
      const schoolPlace = schoolIds.map(() => '?').join(',');
      const orderPlace = orderIds.map(() => '?').join(',');

      const [pRows] = await pool.query<RowDataPacket[]>(
        `
        SELECT school_id, order_id, patsankhya
        FROM school_wise_order_details
        WHERE school_id IN (${schoolPlace})
        AND order_id IN (${orderPlace})
        `,
        [...schoolIds, ...orderIds]
      );

      for (const r of pRows) {
        patsankhyaMap.set(
          `${r.school_id}_${r.order_id}`,
          r.patsankhya
        );
      }
    }

    const finalRows = rows.map(row => ({
      ...row,
      patsankhya:
        patsankhyaMap.get(`${row.school_id}_${row.order_id}`) || null,
    }));

    return NextResponse.json({
      rows: finalRows,
      total: totalRoutes,
      page,
      limit,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: 'Failed to fetch dispatch' },
      { status: 500 }
    );
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
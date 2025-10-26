import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
// import { generateDispatchCode } from '@/lib/dispatchCodeGenerator';

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
       MAX(sh.patsankhya) as patsankhya,
       MIN(rp.route_number) as route_number,
       MIN(rp.class_range) as route_class_range
FROM dispatch_details d
LEFT JOIN zp_order_details z ON d.order_id = z.id
LEFT JOIN schooldata s ON d.school_id = s.schoolid
LEFT JOIN taluka ta ON s.taluka_id = ta.taluka_id
LEFT JOIN centerdata c ON d.center_id = c.center_id
LEFT JOIN truckdata t ON d.truck_id = t.id
LEFT JOIN school_wise_order_details sh ON d.school_id = sh.school_id
LEFT JOIN route_paper rp ON rp.dispatch_code = d.dispatch_code  -- Changed from INNER JOIN to LEFT JOIN
WHERE d.status = 'Active'
GROUP BY d.id, d.dispatch_code, d.item_name, d.school_id, d.center_id, d.truck_id, d.order_id, d.unit, d.total_qty, d.qty_dispatch, d.bal_qty, d.status, d.created_at, d.updated_at, d.class_range, z.order_no, z.period, z.no_of_days, z.financial_year, s.schoolname, s.taluka_id, s.udaisno, ta.name, c.marathi_name, t.truckNo
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
    const { dispatch_ids } = body as {
      dispatch_ids: number[];
    };

    if (!Array.isArray(dispatch_ids) || dispatch_ids.length === 0) {
      return NextResponse.json({ message: 'dispatch_ids array is required' }, { status: 400 });
    }

    await conn.beginTransaction();

    // Get the next route number for this batch
    // const [maxRows] = await conn.query<RowDataPacket[]>('SELECT MAX(route_number) AS lastNum FROM route_paper');
    const [maxRows] = await conn.query<RowDataPacket[]>('SELECT MAX(CAST(route_number AS UNSIGNED)) AS lastNum FROM route_paper');
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
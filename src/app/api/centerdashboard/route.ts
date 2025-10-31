import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order_no') || '20';
    const talukaId = searchParams.get('taluka_id');
    
    // Build WHERE clause for taluka filtering
    let talukaFilter = '';
    if (talukaId) {
      talukaFilter = 'AND sd.taluka_id = ?';
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.center_id,
        c.name,
        c.marathi_name,
        c.taluka_id,
        t.name AS taluka_name,
        -- Total schools in center
        COUNT(DISTINCT CASE WHEN s.status = 'Active' THEN s.schoolid END) AS total_schools,
        -- Schools with orders - count distinct schools (not class_range rows)
        (SELECT COUNT(DISTINCT so.school_id) 
         FROM school_wise_order_details so
         JOIN schooldata sd ON so.school_id = sd.schoolid
         JOIN zp_order_details od ON so.order_id = od.id
         WHERE sd.center = c.center_id
         AND od.order_no = ?
         ${talukaFilter}
         AND so.status = 'Active'
         AND sd.status = 'Active'
         AND od.status = 'Active') AS schools_with_orders,
        -- Schools dispatched
        (SELECT COUNT(DISTINCT so.school_id) 
         FROM school_wise_order_details so
         JOIN schooldata sd ON so.school_id = sd.schoolid
         JOIN zp_order_details od ON so.order_id = od.id
         JOIN dispatch_details dd ON so.school_id = dd.school_id 
           AND so.order_id = dd.order_id
         WHERE sd.center = c.center_id
         AND od.order_no = ?
         ${talukaFilter}
         AND so.status = 'Active'
         AND sd.status = 'Active'
         AND od.status = 'Active'
         AND dd.status = 'Active') AS distributed_schools,
        -- Remaining schools calculation - count distinct schools (not class_range rows)
        ((SELECT COUNT(DISTINCT so.school_id) 
          FROM school_wise_order_details so
          JOIN schooldata sd ON so.school_id = sd.schoolid
          JOIN zp_order_details od ON so.order_id = od.id
          WHERE sd.center = c.center_id
          AND od.order_no = ?
          ${talukaFilter}
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active') - 
         (SELECT COUNT(DISTINCT so.school_id) 
          FROM school_wise_order_details so
          JOIN schooldata sd ON so.school_id = sd.schoolid
          JOIN zp_order_details od ON so.order_id = od.id
          JOIN dispatch_details dd ON so.school_id = dd.school_id 
            AND so.order_id = dd.order_id
          WHERE sd.center = c.center_id
          AND od.order_no = ?
          ${talukaFilter}
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active'
          AND dd.status = 'Active')) AS remaining_schools
      FROM centerdata c
      LEFT JOIN schooldata s ON c.center_id = s.center AND s.status = 'Active'
      LEFT JOIN taluka t ON c.taluka_id = t.taluka_id
      WHERE c.status = 'Active'
      GROUP BY c.center_id, c.name, c.marathi_name, c.taluka_id, t.name
      HAVING schools_with_orders > 0 OR total_schools > 0
      ORDER BY c.name
    `, talukaId 
      ? [orderNo, talukaId, orderNo, talukaId, orderNo, talukaId, orderNo, talukaId]
      : [orderNo, orderNo, orderNo, orderNo]
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch center dashboard data' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order_no') || '20';
    const talukaId = searchParams.get('taluka_id');
    const userId = searchParams.get('user_id'); // Get user_id from query params
    
    // Build WHERE clause for taluka filtering
    let talukaFilter = '';
    const talukaParams: string[] = talukaId ? [talukaId] : [];
    if (talukaId) {
      talukaFilter = 'AND sd.taluka_id = ?';
    }

    // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
    let userFilter = '';
    const userParams: string[] = [];
    if (userId && userId !== '1') { // Only filter if not admin
      userFilter = 'AND c.user_id = ?';
      userParams.push(userId);
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        c.center_id,
        c.name,
        c.marathi_name,
        c.taluka_id,
        t.name AS taluka_name,
        -- Total schools in center
        COUNT(DISTINCT CASE WHEN s.status = 'Active' ${userId && userId !== '1' ? 'AND s.user_id = ?' : ''} THEN s.schoolid END) AS total_schools,
        -- Schools with orders - count distinct schools (not class_range rows)
        (SELECT COUNT(DISTINCT so.school_id) 
         FROM school_wise_order_details so
         JOIN schooldata sd ON so.school_id = sd.schoolid
         JOIN zp_order_details od ON so.order_id = od.id
         WHERE sd.center = c.center_id
         AND od.order_no = ?
         ${talukaFilter}
         ${userId && userId !== '1' ? 'AND sd.user_id = ?' : ''}
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
         ${userId && userId !== '1' ? 'AND sd.user_id = ?' : ''}
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
          ${userId && userId !== '1' ? 'AND sd.user_id = ?' : ''}
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
          ${userId && userId !== '1' ? 'AND sd.user_id = ?' : ''}
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active'
          AND dd.status = 'Active')) AS remaining_schools
      FROM centerdata c
      LEFT JOIN schooldata s ON c.center_id = s.center AND s.status = 'Active' ${userId && userId !== '1' ? 'AND s.user_id = ?' : ''}
      LEFT JOIN taluka t ON c.taluka_id = t.taluka_id
      WHERE c.status = 'Active'
      ${userFilter}
      GROUP BY c.center_id, c.name, c.marathi_name, c.taluka_id, t.name
      HAVING schools_with_orders > 0 OR total_schools > 0
      ORDER BY c.name
    `, [
      ...(userId && userId !== '1' ? userParams : []), // for COUNT in main query
      orderNo,
      ...talukaParams, // for schools_with_orders subquery
      ...(userId && userId !== '1' ? userParams : []), // for schools_with_orders subquery
      orderNo,
      ...talukaParams, // for distributed_schools subquery
      ...(userId && userId !== '1' ? userParams : []), // for distributed_schools subquery
      orderNo,
      ...talukaParams, // for remaining_schools first subquery
      ...(userId && userId !== '1' ? userParams : []), // for remaining_schools first subquery
      orderNo,
      ...talukaParams, // for remaining_schools second subquery
      ...(userId && userId !== '1' ? userParams : []), // for remaining_schools second subquery
      ...(userId && userId !== '1' ? userParams : []), // for LEFT JOIN
      ...userParams // for WHERE user filter
    ]);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch center dashboard data' }, { status: 500 });
  }
}


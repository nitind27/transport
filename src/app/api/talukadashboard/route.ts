import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order_no') || '20'; // Default to order 20
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        t.taluka_id,
        t.name,
        t.name_en,
        -- Total schools in taluka
        COUNT(DISTINCT s.schoolid) AS total_schools,
        -- Schools with orders using your exact query pattern
        (SELECT COUNT(*) 
         FROM school_wise_order_details so
         JOIN schooldata sd ON so.school_id = sd.schoolid
         JOIN zp_order_details od ON so.order_id = od.id
         WHERE sd.taluka_id = t.taluka_id
         AND od.order_no = ?
         AND so.status = 'Active'
         AND sd.status = 'Active'
         AND od.status = 'Active') AS schools_with_orders,
        -- Schools dispatched - ONLY count schools that HAVE orders AND have been dispatched
        (SELECT COUNT(DISTINCT so.school_id) 
         FROM school_wise_order_details so
         JOIN schooldata sd ON so.school_id = sd.schoolid
         JOIN zp_order_details od ON so.order_id = od.id
         JOIN dispatch_details dd ON so.school_id = dd.school_id 
           AND so.order_id = dd.order_id
         WHERE sd.taluka_id = t.taluka_id
         AND od.order_no = ?
         AND so.status = 'Active'
         AND sd.status = 'Active'
         AND od.status = 'Active'
         AND dd.status = 'Active') AS distributed_schools,
        -- Remaining schools calculation
        ((SELECT COUNT(*) 
          FROM school_wise_order_details so
          JOIN schooldata sd ON so.school_id = sd.schoolid
          JOIN zp_order_details od ON so.order_id = od.id
          WHERE sd.taluka_id = t.taluka_id
          AND od.order_no = ?
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active') - 
         (SELECT COUNT(DISTINCT so.school_id) 
          FROM school_wise_order_details so
          JOIN schooldata sd ON so.school_id = sd.schoolid
          JOIN zp_order_details od ON so.order_id = od.id
          JOIN dispatch_details dd ON so.school_id = dd.school_id 
            AND so.order_id = dd.order_id
          WHERE sd.taluka_id = t.taluka_id
          AND od.order_no = ?
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active'
          AND dd.status = 'Active')) AS remaining_schools
      FROM taluka t
      LEFT JOIN schooldata s ON t.taluka_id = s.taluka_id AND s.status = 'Active'
      WHERE t.status = 'Active'
      GROUP BY t.taluka_id, t.name, t.name_en
      ORDER BY t.name
    `, [orderNo, orderNo, orderNo, orderNo]);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch taluka dashboard data' }, { status: 500 });
  }
}
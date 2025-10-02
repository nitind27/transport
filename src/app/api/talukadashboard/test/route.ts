import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order_no') || '20';
    const talukaId = searchParams.get('taluka_id');
    
    if (!talukaId) {
      return NextResponse.json({ error: 'taluka_id parameter is required' }, { status: 400 });
    }

    // Your exact query for schools with orders
    const [schoolsWithOrders] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) AS total_count
      FROM school_wise_order_details so
      JOIN schooldata sd ON so.school_id = sd.schoolid
      JOIN zp_order_details od ON so.order_id = od.id
      WHERE sd.taluka_id = ?
      AND od.order_no = ?
      AND so.status = 'Active'
      AND sd.status = 'Active'
      AND od.status = 'Active'
    `, [talukaId, orderNo]);

    // CORRECTED Query for dispatched schools - only count schools that have BOTH orders AND dispatch
    const [dispatchedSchools] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT so.school_id) AS total_count
      FROM school_wise_order_details so
      JOIN schooldata sd ON so.school_id = sd.schoolid
      JOIN zp_order_details od ON so.order_id = od.id
      JOIN dispatch_details dd ON so.school_id = dd.school_id 
        AND so.order_id = dd.order_id
      WHERE sd.taluka_id = ?
      AND od.order_no = ?
      AND so.status = 'Active'
      AND sd.status = 'Active'
      AND od.status = 'Active'
      AND dd.status = 'Active'
    `, [talukaId, orderNo]);

    // Get list of schools with orders for verification
    const [schoolsList] = await pool.query<RowDataPacket[]>(`
      SELECT 
        sd.schoolid,
        sd.schoolname,
        so.class_range,
        CASE 
          WHEN dd.school_id IS NOT NULL THEN 'Dispatched' 
          ELSE 'Not Dispatched' 
        END as dispatch_status,
        dd.dispatch_code
      FROM school_wise_order_details so
      JOIN schooldata sd ON so.school_id = sd.schoolid
      JOIN zp_order_details od ON so.order_id = od.id
      LEFT JOIN dispatch_details dd ON so.school_id = dd.school_id 
        AND so.order_id = dd.order_id
        AND dd.status = 'Active'
      WHERE sd.taluka_id = ?
      AND od.order_no = ?
      AND so.status = 'Active'
      AND sd.status = 'Active'
      AND od.status = 'Active'
      ORDER BY sd.schoolname
    `, [talukaId, orderNo]);

    // Get taluka name
    const [talukaInfo] = await pool.query<RowDataPacket[]>(`
      SELECT name, name_en FROM taluka WHERE taluka_id = ?
    `, [talukaId]);

    const schoolsWithOrdersCount = schoolsWithOrders[0]?.total_count || 0;
    const dispatchedSchoolsCount = dispatchedSchools[0]?.total_count || 0;
    const remainingSchools = schoolsWithOrdersCount - dispatchedSchoolsCount;

    return NextResponse.json({
      taluka_id: parseInt(talukaId),
      taluka_name: talukaInfo[0]?.name || 'Unknown',
      order_no: orderNo,
      schools_with_orders: schoolsWithOrdersCount,
      distributed_schools: dispatchedSchoolsCount,
      remaining_schools: Math.max(0, remainingSchools),
      schools_list: schoolsList,
      query_used: {
        schools_with_orders_query: `
          SELECT COUNT(*) AS total_count
          FROM school_wise_order_details so
          JOIN schooldata sd ON so.school_id = sd.schoolid
          JOIN zp_order_details od ON so.order_id = od.id
          WHERE sd.taluka_id = ${talukaId}
          AND od.order_no = ${orderNo}
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active'
        `,
        dispatched_schools_query: `
          SELECT COUNT(DISTINCT so.school_id) AS total_count
          FROM school_wise_order_details so
          JOIN schooldata sd ON so.school_id = sd.schoolid
          JOIN zp_order_details od ON so.order_id = od.id
          JOIN dispatch_details dd ON so.school_id = dd.school_id 
            AND so.order_id = dd.order_id
          WHERE sd.taluka_id = ${talukaId}
          AND od.order_no = ${orderNo}
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active'
          AND dd.status = 'Active'
        `
      }
    });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to test taluka counts' }, { status: 500 });
  }
}

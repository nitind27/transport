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

    // Get schools with orders (using your exact query pattern)
    const [schoolsWithOrders] = await pool.query<RowDataPacket[]>(`
      SELECT 
        sd.schoolid,
        sd.schoolname,
        sd.udaisno,
        so.class_range,
        so.patsankhya,
        od.order_no,
        od.period,
        'Has Order' as status
      FROM school_wise_order_details so
      JOIN schooldata sd ON so.school_id = sd.schoolid
      JOIN zp_order_details od ON so.order_id = od.id
      WHERE sd.taluka_id = ?
      AND od.order_no = ?
      AND so.status = 'Active'
      AND sd.status = 'Active'
      AND od.status = 'Active'
      ORDER BY sd.schoolname
    `, [talukaId, orderNo]);

    // Get dispatched schools
    const [dispatchedSchools] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT
        sd.schoolid,
        sd.schoolname,
        sd.udaisno,
        dd.dispatch_code,
        dd.created_at as dispatch_date,
        od.order_no,
        'Dispatched' as status
      FROM dispatch_details dd
      JOIN schooldata sd ON dd.school_id = sd.schoolid
      JOIN zp_order_details od ON dd.order_id = od.id
      WHERE sd.taluka_id = ?
      AND od.order_no = ?
      AND dd.status = 'Active'
      AND sd.status = 'Active'
      AND od.status = 'Active'
      ORDER BY sd.schoolname
    `, [talukaId, orderNo]);

    // Get taluka info
    const [talukaInfo] = await pool.query<RowDataPacket[]>(`
      SELECT name, name_en FROM taluka WHERE taluka_id = ?
    `, [talukaId]);

    // Create a map of dispatched schools for easy lookup
    const dispatchedSchoolIds = new Set(dispatchedSchools.map(school => school.schoolid));

    // Mark schools as dispatched or remaining
    const schoolsWithStatus = schoolsWithOrders.map(school => ({
      ...school,
      is_dispatched: dispatchedSchoolIds.has(school.schoolid),
      dispatch_info: dispatchedSchools.find(ds => ds.schoolid === school.schoolid)
    }));

    return NextResponse.json({
      taluka_id: parseInt(talukaId),
      taluka_name: talukaInfo[0]?.name || 'Unknown',
      order_no: orderNo,
      summary: {
        total_schools_with_orders: schoolsWithOrders.length,
        total_dispatched_schools: dispatchedSchools.length,
        remaining_schools: Math.max(0, schoolsWithOrders.length - dispatchedSchools.length)
      },
      schools_with_orders: schoolsWithStatus,
      dispatched_schools: dispatchedSchools
    });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to get breakdown' }, { status: 500 });
  }
}

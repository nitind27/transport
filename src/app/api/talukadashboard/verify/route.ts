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

    // Get detailed breakdown of schools with their dispatch status
    const [schoolsBreakdown] = await pool.query<RowDataPacket[]>(`
      SELECT 
        sd.schoolid,
        sd.schoolname,
        sd.udaisno,
        so.class_range,
        so.patsankhya,
        od.order_no,
        od.period,
        -- Check dispatch status
        CASE 
          WHEN dd.school_id IS NOT NULL THEN 1 
          ELSE 0 
        END as is_dispatched,
        dd.dispatch_code,
        dd.created_at as dispatch_date,
        -- Count how many dispatch records exist for this school+order
        (SELECT COUNT(*) 
         FROM dispatch_details dd2 
         WHERE dd2.school_id = so.school_id 
         AND dd2.order_id = so.order_id 
         AND dd2.status = 'Active') as dispatch_count
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
      ORDER BY sd.schoolname, so.class_range
    `, [talukaId, orderNo]);

    // Get summary counts
    const totalSchools = schoolsBreakdown.length;
    const dispatchedSchools = schoolsBreakdown.filter(school => school.is_dispatched === 1).length;
    const remainingSchools = totalSchools - dispatchedSchools;

    // Get taluka name
    const [talukaInfo] = await pool.query<RowDataPacket[]>(`
      SELECT name, name_en FROM taluka WHERE taluka_id = ?
    `, [talukaId]);

    return NextResponse.json({
      taluka_id: parseInt(talukaId),
      taluka_name: talukaInfo[0]?.name || 'Unknown',
      order_no: orderNo,
      summary: {
        total_schools_with_orders: totalSchools,
        dispatched_schools: dispatchedSchools,
        remaining_schools: remainingSchools
      },
      schools_breakdown: schoolsBreakdown.map(school => ({
        schoolid: school.schoolid,
        schoolname: school.schoolname,
        udaisno: school.udaisno,
        class_range: school.class_range,
        patsankhya: school.patsankhya,
        is_dispatched: school.is_dispatched === 1,
        dispatch_code: school.dispatch_code,
        dispatch_date: school.dispatch_date,
        dispatch_count: school.dispatch_count
      }))
    });
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to verify taluka data' }, { status: 500 });
  }
}


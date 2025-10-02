import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order_no');
    const talukaId = searchParams.get('taluka_id');
    
    const whereConditions = ['zod.status = "Active"', 's.status = "Active"', 'swo.status = "Active"'];
    const queryParams: string[] = [];
    
    if (orderNo) {
      whereConditions.push('zod.order_no = ?');
      queryParams.push(orderNo);
    }
    
    if (talukaId) {
      whereConditions.push('s.taluka_id = ?');
      queryParams.push(talukaId);
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        s.schoolid,
        s.schoolname,
        s.taluka_id,
        t.name as taluka_name,
        zod.id as order_id,
        zod.order_no,
        zod.period,
        zod.financial_year,
        swo.class_range,
        swo.patsankhya,
        -- Check if dispatched
        CASE 
          WHEN dd.school_id IS NOT NULL THEN 'Yes' 
          ELSE 'No' 
        END as is_dispatched,
        dd.dispatch_code,
        dd.created_at as dispatch_date
      FROM schooldata s
      INNER JOIN school_wise_order_details swo ON s.schoolid = swo.school_id
      INNER JOIN zp_order_details zod ON swo.order_id = zod.id
      LEFT JOIN taluka t ON s.taluka_id = t.taluka_id
      LEFT JOIN dispatch_details dd ON s.schoolid = dd.school_id 
        AND dd.order_id = zod.id 
        AND dd.status = 'Active'
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY t.name, s.schoolname, zod.order_no
    `, queryParams);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch detailed school data' }, { status: 500 });
  }
}

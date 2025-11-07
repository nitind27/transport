import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNo = searchParams.get('order_no') || '20';
    const centerId = searchParams.get('center_id');
    const talukaId = searchParams.get('taluka_id');
    const userId = searchParams.get('user_id'); // Get user_id from query params
    const companyId = searchParams.get('company_id'); // Get company_id from query params
    
    // Build WHERE clause for center filtering
    let centerFilter = '';
    const centerParams: string[] = centerId ? [centerId] : [];
    if (centerId) {
      centerFilter = 'AND sd.center = ?';
    }
    
    // Build WHERE clause for taluka filtering
    let talukaFilter = '';
    const talukaParams: string[] = talukaId ? [talukaId] : [];
    if (talukaId) {
      talukaFilter = 'AND t.taluka_id = ?';
    }

    // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
    let userFilter = '';
    const userParams: string[] = [];
    if (userId && userId.trim() !== '' && userId !== '1') { // Only filter if not admin
      userFilter = 'AND t.user_id = ?';
      userParams.push(userId.trim());
    }

    // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
    let companyFilter = '';
    const companyParams: string[] = [];
    if (companyId && companyId.trim() !== '') {
      companyFilter = 'AND sd.company_id = ?';
      companyParams.push(companyId.trim());
    }
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        t.taluka_id,
        t.name,
        t.name_en,
        -- Total schools in taluka (filtered by center if provided)
        COUNT(DISTINCT CASE WHEN s.status = 'Active' ${centerId ? 'AND s.center = ?' : ''} ${userId && userId.trim() !== '' && userId !== '1' ? 'AND s.user_id = ?' : ''} ${companyId && companyId.trim() !== '' ? 'AND s.company_id = ?' : ''} THEN s.schoolid END) AS total_schools,
        -- Schools with orders - count distinct schools (not class_range rows)
        (SELECT COUNT(DISTINCT so.school_id) 
         FROM school_wise_order_details so
         JOIN schooldata sd ON so.school_id = sd.schoolid
         JOIN zp_order_details od ON so.order_id = od.id
         WHERE sd.taluka_id = t.taluka_id
         AND od.order_no = ?
         ${centerFilter}
         ${userId && userId.trim() !== '' && userId !== '1' ? 'AND sd.user_id = ?' : ''}
         ${companyFilter}
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
         WHERE sd.taluka_id = t.taluka_id
         AND od.order_no = ?
         ${centerFilter}
         ${userId && userId.trim() !== '' && userId !== '1' ? 'AND sd.user_id = ?' : ''}
         ${companyFilter}
         AND so.status = 'Active'
         AND sd.status = 'Active'
         AND od.status = 'Active'
         AND dd.status = 'Active') AS distributed_schools,
        -- Remaining schools calculation - count distinct schools (not class_range rows)
        ((SELECT COUNT(DISTINCT so.school_id) 
          FROM school_wise_order_details so
          JOIN schooldata sd ON so.school_id = sd.schoolid
          JOIN zp_order_details od ON so.order_id = od.id
          WHERE sd.taluka_id = t.taluka_id
          AND od.order_no = ?
          ${centerFilter}
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
          WHERE sd.taluka_id = t.taluka_id
          AND od.order_no = ?
          ${centerFilter}
          ${userId && userId !== '1' ? 'AND sd.user_id = ?' : ''}
          AND so.status = 'Active'
          AND sd.status = 'Active'
          AND od.status = 'Active'
          AND dd.status = 'Active')) AS remaining_schools
      FROM taluka t
      LEFT JOIN schooldata s ON t.taluka_id = s.taluka_id AND s.status = 'Active' ${centerId ? 'AND s.center = ?' : ''} ${userId && userId.trim() !== '' && userId !== '1' ? 'AND s.user_id = ?' : ''} ${companyId && companyId.trim() !== '' ? 'AND s.company_id = ?' : ''}
      WHERE t.status = 'Active'
      ${talukaFilter}
      ${userFilter}
      GROUP BY t.taluka_id, t.name, t.name_en
      ORDER BY t.name
    `, [
      ...(userId && userId.trim() !== '' && userId !== '1' ? userParams : []), // for COUNT in main query
      ...centerParams, // for COUNT in main query
      ...(companyId && companyId.trim() !== '' ? companyParams : []), // for COUNT in main query
      orderNo,
      ...centerParams, // for schools_with_orders subquery
      ...(userId && userId.trim() !== '' && userId !== '1' ? userParams : []), // for schools_with_orders subquery
      ...(companyId && companyId.trim() !== '' ? companyParams : []), // for schools_with_orders subquery
      orderNo,
      ...centerParams, // for distributed_schools subquery
      ...(userId && userId.trim() !== '' && userId !== '1' ? userParams : []), // for distributed_schools subquery
      ...(companyId && companyId.trim() !== '' ? companyParams : []), // for distributed_schools subquery
      orderNo,
      ...centerParams, // for remaining_schools first subquery
      ...(userId && userId.trim() !== '' && userId !== '1' ? userParams : []), // for remaining_schools first subquery
      ...(companyId && companyId.trim() !== '' ? companyParams : []), // for remaining_schools first subquery
      orderNo,
      ...centerParams, // for remaining_schools second subquery
      ...(userId && userId.trim() !== '' && userId !== '1' ? userParams : []), // for remaining_schools second subquery
      ...(companyId && companyId.trim() !== '' ? companyParams : []), // for remaining_schools second subquery
      ...centerParams, // for LEFT JOIN
      ...(userId && userId.trim() !== '' && userId !== '1' ? userParams : []), // for LEFT JOIN
      ...(companyId && companyId.trim() !== '' ? companyParams : []), // for LEFT JOIN
      ...talukaParams, // for WHERE taluka filter
      ...userParams // for WHERE user filter
    ]);
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch taluka dashboard data' }, { status: 500 });
  }
}
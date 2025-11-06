import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const companyId = searchParams.get('company_id');

    // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
    let userFilter = '';
    const userParams: string[] = [];
    if (userId && userId.trim() !== '' && userId !== '1') {
      userFilter = 'AND s.user_id = ?';
      userParams.push(userId.trim());
    }

    // Build WHERE clause for company_id filtering - Only add if not empty
    let companyFilter = '';
    const companyParams: string[] = [];
    if (companyId && companyId.trim() !== '') {
      companyFilter = 'AND s.company_id = ?';
      companyParams.push(companyId.trim());
    }

    // Combine all parameters
    const allParams = [...userParams, ...companyParams];

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
             c.name AS center_name_en,
             t.truckNo,
             t.ownerId,
             t.ownerName,
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
      LEFT JOIN route_paper rp ON rp.dispatch_code = d.dispatch_code
      WHERE d.status = 'Active'
        AND rp.route_number IS NOT NULL
        AND rp.route_number != ''
        ${userFilter}
        ${companyFilter}
      GROUP BY d.id, d.dispatch_code, d.item_name, d.school_id, d.center_id, d.truck_id, d.order_id, d.unit, d.total_qty, d.qty_dispatch, d.bal_qty, d.status, d.created_at, d.updated_at, d.class_range, z.order_no, z.period, z.no_of_days, z.financial_year, s.schoolname, s.taluka_id, s.udaisno, ta.name, c.marathi_name, c.name, t.truckNo, t.ownerId, t.ownerName
      ORDER BY d.created_at DESC;
    `, allParams.length > 0 ? allParams : undefined);
    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to fetch transportation details' }, { status: 500 });
  }
}


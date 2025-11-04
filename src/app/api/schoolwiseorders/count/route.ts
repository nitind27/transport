import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id'); // Get user_id from query params

    // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
    const userParams: string[] = [];
    const shouldFilterByUser = userId && userId !== '1'; // Only filter if not admin
    
    if (shouldFilterByUser) {
      userParams.push(userId);
    }

    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        zod.id as order_id,
        zod.order_no,
        zod.period,
        zod.financial_year,
        zod.no_of_days,
        -- Count schools with proper matching conditions
        COUNT(DISTINCT CASE 
          WHEN swo.status = 'Active' 
            AND swo.school_id = s.schoolid 
            AND swo.order_id = zod.id
            AND s.status = 'Active'
            ${shouldFilterByUser ? 'AND s.user_id = ?' : ''}
          THEN s.schoolid 
        END) as total_schools,
        -- Count dispatched schools with proper matching
        COUNT(DISTINCT CASE 
          WHEN dd.status = 'Active' 
            AND dd.school_id = s.schoolid 
            AND dd.order_id = zod.id
            AND swo.school_id = s.schoolid
            AND swo.order_id = zod.id
            AND swo.status = 'Active'
            AND s.status = 'Active'
            ${shouldFilterByUser ? 'AND s.user_id = ?' : ''}
          THEN s.schoolid 
        END) as dispatched_schools,
        -- Calculate remaining schools
        (COUNT(DISTINCT CASE 
          WHEN swo.status = 'Active' 
            AND swo.school_id = s.schoolid 
            AND swo.order_id = zod.id
            AND s.status = 'Active'
            ${shouldFilterByUser ? 'AND s.user_id = ?' : ''}
          THEN s.schoolid 
        END) - COUNT(DISTINCT CASE 
          WHEN dd.status = 'Active' 
            AND dd.school_id = s.schoolid 
            AND dd.order_id = zod.id
            AND swo.school_id = s.schoolid
            AND swo.order_id = zod.id
            AND swo.status = 'Active'
            AND s.status = 'Active'
            ${shouldFilterByUser ? 'AND s.user_id = ?' : ''}
          THEN s.schoolid 
        END)) as remaining_schools
      FROM zp_order_details zod
      LEFT JOIN school_wise_order_details swo ON zod.id = swo.order_id AND swo.status = 'Active'
      LEFT JOIN schooldata s ON swo.school_id = s.schoolid AND s.status = 'Active'
      LEFT JOIN dispatch_details dd ON swo.school_id = dd.school_id 
        AND swo.order_id = dd.order_id 
        AND dd.status = 'Active'
      WHERE zod.status = 'Active'
      GROUP BY zod.id, zod.order_no, zod.period, zod.financial_year, zod.no_of_days
      ORDER BY zod.order_no
    `, shouldFilterByUser
      ? [...userParams, ...userParams, ...userParams, ...userParams] // 4 times for the 4 CASE statements
      : []
    );
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database query failed:', error);
    return NextResponse.json({ error: 'Failed to fetch school counts by order' }, { status: 500 });
  }
}

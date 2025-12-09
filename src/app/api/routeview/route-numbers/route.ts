import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
  try {
    // Get query parameters from URL
    const url = new URL(req.url);
    const fromDate = url.searchParams.get('fromDate');
    const endDate = url.searchParams.get('endDate');
    const userId = url.searchParams.get('user_id');
    const companyId = url.searchParams.get('company_id');
    const categoryId = url.searchParams.get('category_id');

    console.log('Route-numbers API - Filters:', { fromDate, endDate, userId, companyId, categoryId });

    // Build WHERE clause for company_id filtering - Always apply if provided
    let companyFilter = '';
    const companyParams: string[] = [];
    if (companyId && companyId.trim() !== '') {
      companyFilter = 'AND COALESCE(d.company_id, s.company_id) = ?';
      companyParams.push(companyId.trim());
    }

    // Build the WHERE clause and params dynamically
    let whereClause = `WHERE d.status = 'Active'`;
    const params: Array<string> = [];

    // Validate YYYY-MM-DD format
    const isValidDate = (d?: string | null) => !!(d && /^\d{4}-\d{2}-\d{2}$/.test(d));

    let startDate = isValidDate(fromDate) ? fromDate! : undefined;
    let endDateFilter = isValidDate(endDate) ? endDate! : undefined;

    // If both present but reversed, swap
    if (startDate && endDateFilter && startDate > endDateFilter) {
      const tmp = startDate;
      startDate = endDateFilter;
      endDateFilter = tmp;
    }

    // If only one bound is provided, treat it as a single-day filter
    if (startDate && !endDateFilter) endDateFilter = startDate;
    if (!startDate && endDateFilter) startDate = endDateFilter;

    // Use index-friendly range filter (no function on column)
    if (startDate && endDateFilter) {
      whereClause += ` AND d.created_at >= ? AND d.created_at < DATE_ADD(?, INTERVAL 1 DAY)`;
      params.push(`${startDate} 00:00:00`, `${endDateFilter} 00:00:00`);
    }

    // Add company_id filter
    whereClause += ` ${companyFilter}`;

    // Query to get distinct route numbers within the date range
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT COALESCE(rp.route_number, d.dispatch_code) as route_number
      FROM dispatch_details d
      LEFT JOIN route_paper rp ON rp.dispatch_code = d.dispatch_code
      LEFT JOIN schooldata s ON d.school_id = s.schoolid
      ${whereClause}
      ORDER BY CAST(COALESCE(rp.route_number, '0') AS UNSIGNED) ASC
    `, [...params, ...companyParams]);

    // Extract route numbers and return as array
    const routeNumbers = rows.map(row => row.route_number).filter(Boolean);

    console.log('Route-numbers API - Found route numbers:', routeNumbers.length, routeNumbers.slice(0, 10));

    return NextResponse.json(routeNumbers);
  } catch (e) {
    console.error('Route-numbers API error:', e);
    return NextResponse.json({ message: 'Failed to fetch route numbers' }, { status: 500 });
  }
}

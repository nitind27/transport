import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
    let connection;
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get('user_id');
        const companyId = url.searchParams.get('company_id');

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

        connection = await pool.getConnection();

        // Build filters for subqueries based on user_id and company_id
        // Note: stockinventory, stocktransfer, and stockmanage tables don't have user_id/company_id columns
        // So we only filter dispatch_details which links to schools (which have user_id/company_id)
        const allParams: string[] = [];
        
        // Build dispatch_details (Dispatch) subquery with user/company filtering through schools
        let dispatchJoin = '';
        let dispatchWhere = 'WHERE dd.status = \'Active\'';
        const dispatchParams: string[] = [];
        if (userParams.length > 0 || companyParams.length > 0) {
            dispatchJoin = `INNER JOIN schooldata s ON dd.school_id = s.schoolid AND s.status = 'Active'`;
            dispatchWhere = `WHERE dd.status = 'Active' ${userFilter} ${companyFilter}`;
            dispatchParams.push(...userParams, ...companyParams);
        }
        
        // Note: stockinventory, stocktransfer, and stockmanage don't have user_id/company_id columns
        // So we don't filter them - they will show all data
        // If you need to filter these tables, you'll need to add user_id and company_id columns to those tables
        
        allParams.push(...dispatchParams);

        // Build WHERE clause to filter grains - only show grains that have data for this user/company
        // Since dispatch_details is filtered by user/company, we'll show grains that have dispatch data
        // OR if no filters, show all grains with any data
        // We need to wrap in a subquery to use WHERE with aliases
        let whereClause = '';
        if (userParams.length > 0 || companyParams.length > 0) {
            // Only show grains that have dispatch data for this user/company
            // (dispatch is the only one properly filtered by user/company)
            whereClause = 'WHERE dispatchQty > 0';
        } else {
            // If no user/company filter (admin), show all grains with any data
            whereClause = 'WHERE (inwardQty > 0 OR dispatchQty > 0 OR transferQty > 0 OR damageQty > 0)';
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            `
SELECT * FROM (
  SELECT
    ig.id,
    ig.name AS grain,
    ig.Unit AS units,
    COALESCE(si.inwardQty, 0) AS inwardQty,
    COALESCE(dd.dispatchQty, 0) AS dispatchQty,
    COALESCE(st.transferQty, 0) AS transferQty,
    COALESCE(sm.damageQty, 0) AS damageQty,
    -- Updated balance: inwardQty - dispatchQty - transferQty - damageQty
    (COALESCE(si.inwardQty, 0) 
      - COALESCE(dd.dispatchQty, 0) 
      - COALESCE(st.transferQty, 0) 
      - COALESCE(sm.damageQty, 0)) AS balanceQty
  FROM itemsgrains ig
  LEFT JOIN (
    SELECT grain, SUM(weight) AS inwardQty
    FROM stockinventory
    WHERE status = 'Active'
    GROUP BY grain
  ) si ON LOWER(TRIM(si.grain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
  LEFT JOIN (
    SELECT dd.item_name, SUM(dd.qty_dispatch) AS dispatchQty
    FROM dispatch_details dd
    ${dispatchJoin}
    ${dispatchWhere}
    GROUP BY dd.item_name
  ) dd ON LOWER(TRIM(dd.item_name)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
  LEFT JOIN (
    SELECT itemGrain, SUM(weight) AS transferQty
    FROM stocktransfer
    WHERE status = 'Active'
    GROUP BY itemGrain
  ) st ON LOWER(TRIM(st.itemGrain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
  LEFT JOIN (
    SELECT itemGrain, SUM(quantity) AS damageQty
    FROM stockmanage
    WHERE status = 'Active'
    GROUP BY itemGrain
  ) sm ON LOWER(TRIM(sm.itemGrain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
) AS filtered_data
${whereClause};
      `,
            allParams.length > 0 ? allParams : undefined
        );

        return NextResponse.json(rows);
    } catch (error) {
        console.error('Enhanced stock inventory query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch enhanced stock inventory data' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

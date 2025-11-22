import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
    let connection;
    try {
        const url = new URL(req.url);
        const companyId = url.searchParams.get('company_id');

        // Build WHERE clause for company_id filtering
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId && companyId.trim() !== '') {
            companyFilter = 'AND s.company_id = ?';
            companyParams.push(companyId.trim());
        }

        connection = await pool.getConnection();

        // Check if company_id column exists in stockinventory table
        const [siColumns] = await connection.query<RowDataPacket[]>(
            `SHOW COLUMNS FROM stockinventory LIKE 'company_id'`
        );
        
        const siHasCompanyId = Array.isArray(siColumns) && siColumns.length > 0;

        // Build filters for subqueries based on company_id only
        const allParams: string[] = [];
        
        // Build stockinventory (Inward) subquery with company filtering
        let stockInventoryWhere = 'WHERE status = \'Active\'';
        const stockInventoryParams: string[] = [];
        if (siHasCompanyId && companyParams.length > 0) {
            stockInventoryWhere += ` AND company_id = ?`;
            stockInventoryParams.push(...companyParams);
        }
        
        // Build dispatch_details (Dispatch) subquery with company filtering through schools
        let dispatchJoin = '';
        let dispatchWhere = 'WHERE dd.status = \'Active\'';
        const dispatchParams: string[] = [];
        if (companyParams.length > 0) {
            dispatchJoin = `INNER JOIN schooldata s ON dd.school_id = s.schoolid AND s.status = 'Active'`;
            dispatchWhere = `WHERE dd.status = 'Active' ${companyFilter}`;
            dispatchParams.push(...companyParams);
        }
        
        allParams.push(...stockInventoryParams, ...dispatchParams);

        // Build WHERE clause to filter grains - only show grains that have data for this company
        let whereClause = '';
        if (companyParams.length > 0) {
            // Show grains that have any data (inward, dispatch, transfer, or damage) for this company
            // Since we're filtering stockinventory by company_id, inwardQty will also be filtered
            whereClause = 'WHERE (inwardQty > 0 OR dispatchQty > 0 OR transferQty > 0 OR damageQty > 0)';
        } else {
            // If no company filter (admin), show all grains with any data
            whereClause = 'WHERE (inwardQty > 0 OR dispatchQty > 0 OR transferQty > 0 OR damageQty > 0)';
        }

        // Build the query with proper parameterization
        // Note: We need to construct the SQL string carefully to match parameter order
        const query = `
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
    ${stockInventoryWhere}
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
        `;

        const [rows] = await connection.query<RowDataPacket[]>(
            query,
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

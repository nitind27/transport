import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();

        // Enhanced query to get all stock data with calculations
//         const [rows] = await pool.query<RowDataPacket[]>(
//             `
// SELECT
//   ig.id,
//   ig.name AS grain,
//   ig.Unit AS units,
//   COALESCE(si.inwardQty, 0) AS inwardQty,
//   COALESCE(dd.dispatchQty, 0) AS dispatchQty,
//   COALESCE(st.transferQty, 0) AS transferQty,
//   COALESCE(sm.damageQty, 0) AS damageQty,
//   -- balanceQty = inwardQty - transferQty - damageQty
//   (COALESCE(si.inwardQty, 0) - COALESCE(st.transferQty, 0) - COALESCE(sm.damageQty, 0)) AS balanceQty
// FROM itemsgrains ig
// LEFT JOIN (
//   SELECT grain, SUM(weight) AS inwardQty
//   FROM stockinventory
//   WHERE status = 'Active'
//   GROUP BY grain
// ) si ON LOWER(TRIM(si.grain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
// LEFT JOIN (
//   SELECT item_name, SUM(qty_dispatch) AS dispatchQty
//   FROM dispatch_details
//   WHERE status = 'Active'
//   GROUP BY item_name
// ) dd ON LOWER(TRIM(dd.item_name)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
// LEFT JOIN (
//   SELECT itemGrain, SUM(weight) AS transferQty
//   FROM stocktransfer
//   WHERE status = 'Active'
//   GROUP BY itemGrain
// ) st ON LOWER(TRIM(st.itemGrain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
// LEFT JOIN (
//   SELECT itemGrain, SUM(quantity) AS damageQty
//   FROM stockmanage
//   WHERE status = 'Active'
//   GROUP BY itemGrain
// ) sm ON LOWER(TRIM(sm.itemGrain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci;

          

//       `
//         );
        const [rows] = await pool.query<RowDataPacket[]>(
            `
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
  SELECT item_name, SUM(qty_dispatch) AS dispatchQty
  FROM dispatch_details
  WHERE status = 'Active'
  GROUP BY item_name
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
) sm ON LOWER(TRIM(sm.itemGrain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci;

          

      `
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

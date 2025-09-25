import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const routeNumber = url.searchParams.get('route');
    
    if (!routeNumber) {
      return NextResponse.json({ message: 'Route number is required' }, { status: 400 });
    }

    // Get all dispatch details for the route with proper item information
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        d.item_name,
        d.unit,
        d.qty_dispatch,
        d.total_qty,
        ig.name as proper_item_name,
        ig.Unit as proper_unit,
        si.rate,
        si.totalAmount,
        si.weight
      FROM dispatch_details d
      LEFT JOIN route_paper r ON d.dispatch_code = r.dispatch_code
      LEFT JOIN itemsgrains ig ON LOWER(d.item_name) LIKE LOWER(CONCAT('%', ig.name, '%'))
      LEFT JOIN stockinventory si ON LOWER(si.grain) LIKE LOWER(CONCAT('%', d.item_name, '%'))
      WHERE r.route_number = ? 
        AND d.status = 'Active'
        AND r.route_number IS NOT NULL
      ORDER BY d.item_name
    `, [routeNumber]);

    // Aggregate items by name
    const itemTotals: Record<string, {
      name: string;
      unit: string;
      totalQty: number;
      totalDispatch: number;
      avgRate: number;
      totalAmount: number;
      count: number;
    }> = {};

    rows.forEach((row) => {
      const itemName = row.proper_item_name || row.item_name;
      const unit = row.proper_unit || row.unit;
      
      if (!itemTotals[itemName]) {
        itemTotals[itemName] = {
          name: itemName,
          unit: unit,
          totalQty: 0,
          totalDispatch: 0,
          avgRate: 0,
          totalAmount: 0,
          count: 0
        };
      }
      
      itemTotals[itemName].totalQty += Number(row.total_qty || 0);
      itemTotals[itemName].totalDispatch += Number(row.qty_dispatch || 0);
      itemTotals[itemName].avgRate = (itemTotals[itemName].avgRate * itemTotals[itemName].count + Number(row.rate || 0)) / (itemTotals[itemName].count + 1);
      itemTotals[itemName].totalAmount += Number(row.totalAmount || 0);
      itemTotals[itemName].count += 1;
    });

    // Convert to array and calculate proper totals
    const result = Object.values(itemTotals).map(item => ({
      name: item.name,
      unit: item.unit,
      totalQty: item.totalQty,
      totalDispatch: item.totalDispatch,
      rate: item.avgRate,
      totalAmount: item.totalAmount || (item.totalDispatch * item.avgRate)
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error('Route item totals error:', e);
    return NextResponse.json({ message: 'Failed to fetch route item totals' }, { status: 500 });
  }
}

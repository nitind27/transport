import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type SwoRow = {
  items_data: string; // JSON string in DB
  status: string;
};

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[] & SwoRow[]>(
      `SELECT items_data FROM school_wise_order_details WHERE status = 'Active'`
    );

    const totals: Record<string, number> = {};

    (rows || []).forEach((r) => {
      const obj = typeof r.items_data === 'string' ? JSON.parse(r.items_data) : r.items_data;
      if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
          const qty = Number(v) || 0;
          if (!totals[k]) totals[k] = 0;
          totals[k] += qty;
        });
      }
    });

    const result = Object.entries(totals).map(([grain, total]) => ({
      grain,           // Marathi item name, e.g., 'तांदुळ'
      totalQuantity: total,
      units: 'किलो',   // default units; adjust if you store per-item units elsewhere
    }));

    return NextResponse.json(result);
  } catch (e) {
    console.error('Aggregate error:', e);
    return NextResponse.json({ error: 'Failed to aggregate' }, { status: 500 });
  }
}

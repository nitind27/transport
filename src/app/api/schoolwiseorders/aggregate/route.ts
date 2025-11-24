import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

type SwoRow = {
  items_data: string; // JSON string in DB
  status: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');

    console.log('School Wise Orders Aggregate API - Request params:', { companyId, url: req.url });

    // Build WHERE clause for company_id filtering
    // Check both school_wise_order_details.company_id and schooldata.company_id
    let companyFilter = '';
    const companyParams: string[] = [];
    if (companyId && companyId.trim() !== '') {
      companyFilter = 'AND (swo.company_id = ? OR s.company_id = ?)';
      companyParams.push(companyId.trim(), companyId.trim());
    }

    const query = `
      SELECT swo.items_data 
      FROM school_wise_order_details swo
      INNER JOIN schooldata s ON swo.school_id = s.schoolid AND s.status = 'Active'
      WHERE swo.status = 'Active'
        ${companyFilter}
    `;

    const [rows] = await pool.query<RowDataPacket[] & SwoRow[]>(
      query,
      companyParams.length > 0 ? companyParams : undefined
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

    console.log('School Wise Orders Aggregate API - Query success, result count:', result.length);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Aggregate error:', e);
    return NextResponse.json({ error: 'Failed to aggregate' }, { status: 500 });
  }
}

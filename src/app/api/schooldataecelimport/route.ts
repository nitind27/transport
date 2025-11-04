import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';
import { RowDataPacket } from 'mysql2';

type DistrictRow = { district_id: number; name: string } & RowDataPacket;
type TalukaRow = { taluka_id: number; name: string; dist_id: number } & RowDataPacket;
type CenterRow = { center_id: number; marathi_name: string; taluka_id: number; dist_id: number } & RowDataPacket;

const EXPECTED_HEADERS = ['जिल्हा','तालुका','केंद्र','विद्यालय नाव','यूडीएआयएस','मोबाइल 1','मोबाइल 2','मोबाइल 3'];

interface SchoolDataRow {
  'जिल्हा': string;
  'तालुका': string;
  'केंद्र': string;
  'विद्यालय नाव': string;
  'यूडीएआयएस': string;
  'मोबाइल 1': string;
  'मोबाइल 2': string;
  'मोबाइल 3': string;
}

interface ErrorRow {
  row: number;
  reason: string;
  data: SchoolDataRow;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    // Get company_id and user_id from FormData
    const companyId = form.get('company_id');
    const userId = form.get('user_id');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: 'file is required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ message: 'No sheet found' }, { status: 400 });
    }
    const ws = wb.Sheets[sheetName];

    // Validate header row
    const headerRow = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, range: 0, raw: false });
    const firstRow = (headerRow?.[0] || []).map((h: string) => String(h || '').trim());
    if (EXPECTED_HEADERS.join('|') !== firstRow.join('|')) {
      return NextResponse.json({
        message: 'Invalid header row',
        expected: EXPECTED_HEADERS,
        received: firstRow,
      }, { status: 400 });
    }

    // Parse rows with headers, skipping header line
    const rows = XLSX.utils.sheet_to_json<SchoolDataRow>(ws, {
      header: EXPECTED_HEADERS,
      range: 1,
      defval: '',
      raw: false,
    });

    if (!rows.length) {
      return NextResponse.json({ message: 'No data rows found' }, { status: 400 });
    }

    // Reference data
    const [districtsRes, talukasRes, centersRes] = await Promise.all([
      pool.query('SELECT district_id, name FROM district WHERE status = "Active"'),
      pool.query('SELECT taluka_id, name, dist_id FROM taluka WHERE status = "Active"'),
      pool.query('SELECT center_id, marathi_name, taluka_id, dist_id FROM centerdata WHERE status = "Active"'),
    ]);
    
    // Extract the rows from the query results (index 0 contains the data)
    const districts = districtsRes[0] as DistrictRow[];
    const talukas = talukasRes[0] as TalukaRow[];
    const centers = centersRes[0] as CenterRow[];

    const districtByName = new Map(districts.map(d => [d.name.trim(), d]));
    const talukaByKey = new Map(talukas.map(t => [`${t.name.trim()}|${t.dist_id}`, t]));
    const centerByKey = new Map(centers.map(c => [`${c.marathi_name.trim()}|${c.taluka_id}|${c.dist_id}`, c]));

    let inserted = 0;
    const errors: ErrorRow[] = [];

    // Parse company_id and user_id to integers
    const company_id = companyId ? parseInt(String(companyId)) : null;
    const user_id = userId ? parseInt(String(userId)) : null;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // header at row 1

      const distName = String(r['जिल्हा'] || '').trim();
      const talukaName = String(r['तालुका'] || '').trim();
      const centerName = String(r['केंद्र'] || '').trim();
      const schoolName = String(r['विद्यालय नाव'] || '').trim();
      const udaisno = String(r['यूडीएआयएस'] || '').trim();
      const mobile1 = String(r['मोबाइल 1'] || '').trim();
      const mobile2 = String(r['मोबाइल 2'] || '').trim();
      const mobile3 = String(r['मोबाइल 3'] || '').trim();

      if (!distName || !talukaName || !centerName || !schoolName || !udaisno) {
        errors.push({ row: rowNum, reason: 'Missing required fields', data: r });
        continue;
      }

      const dist = districtByName.get(distName);
      if (!dist) {
        errors.push({ row: rowNum, reason: `District not found: ${distName}`, data: r });
        continue;
      }

      const taluka = talukaByKey.get(`${talukaName}|${dist.district_id}`);
      if (!taluka) {
        errors.push({ row: rowNum, reason: `Taluka not found in district: ${talukaName}`, data: r });
        continue;
      }

      const center = centerByKey.get(`${centerName}|${taluka.taluka_id}|${dist.district_id}`);
      if (!center) {
        errors.push({ row: rowNum, reason: `Center not found for taluka/district: ${centerName}`, data: r });
        continue;
      }

      // Always INSERT (no update) - Include company_id and user_id
      await pool.query(
        `INSERT INTO schooldata (schoolname, district, taluka_id, village_id, center, udaisno, mobile1, mobile2, mobile3, status, company_id, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`,
        [schoolName, dist.district_id, taluka.taluka_id, 1, center.center_id, udaisno, mobile1 || null, mobile2 || null, mobile3 || null, company_id, user_id]
      );
      inserted += 1;
    }

    return NextResponse.json({ inserted, errors });
  } catch (err) {
    console.error('schooldata import error:', err);
    return NextResponse.json({ message: 'Import failed' }, { status: 500 });
  }
}
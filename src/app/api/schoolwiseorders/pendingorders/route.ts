import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// GET - Fetch only pending school-wise orders (not dispatched)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const companyId = searchParams.get('company_id');

        console.log('School Wise Orders Pending API - Request params:', { companyId, url: req.url });

        // Build WHERE clause for company_id filtering - Always apply if provided
        // Check both school_wise_order_details.company_id and schooldata.company_id
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId && companyId.trim() !== '') {
            companyFilter = 'AND (swo.company_id = ? OR s.company_id = ?)';
            companyParams.push(companyId.trim(), companyId.trim());
        }

        const [rows] = await pool.query<RowDataPacket[]>(`
            SELECT 
                swo.*,
                zod.order_no,
                zod.no_of_days,
                zod.period,
                zod.financial_year,
                s.schoolname,
                s.udaisno,
                s.taluka_id,
                t.name as taluka_name,
                -- Check if this specific school + class_range combination has been dispatched
                CASE 
                    WHEN dd.school_id IS NOT NULL 
                      AND dd.order_id = swo.order_id 
                      AND dd.school_id = swo.school_id
                      AND dd.class_range = swo.class_range
                      AND dd.status = 'Active'
                    THEN 1 
                    ELSE 0 
                END as is_dispatched,
                dd.dispatch_code,
                dd.created_at as dispatch_date
            FROM school_wise_order_details swo
            INNER JOIN zp_order_details zod ON swo.order_id = zod.id AND zod.status = 'Active'
            INNER JOIN schooldata s ON swo.school_id = s.schoolid AND s.status = 'Active'
            LEFT JOIN taluka t ON s.taluka_id = t.taluka_id AND t.status = 'Active'
            LEFT JOIN dispatch_details dd ON swo.school_id = dd.school_id 
                AND swo.order_id = dd.order_id 
                AND swo.class_range = dd.class_range
                AND dd.status = 'Active'
            WHERE swo.status = 'Active'
            AND (dd.school_id IS NULL OR dd.status != 'Active' OR dd.status IS NULL)
                ${companyFilter}
            ORDER BY s.schoolname, swo.class_range, swo.created_at DESC
        `, companyParams.length > 0 ? companyParams : undefined);
        
        console.log('School Wise Orders Pending API - Query success, rows:', rows.length);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch pending orders' }, { status: 500 });
    }
}

// POST - Create new school-wise order detail
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_id, school_id, items_data, total_weight, class_range, patsankhya } = body;

        if (!order_id || !school_id || !items_data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO school_wise_order_details 
             (order_id, school_id, items_data, total_weight, class_range, patsankhya, status) 
             VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
            [order_id, school_id, JSON.stringify(items_data), total_weight || 0, class_range || null, patsankhya || 0]
        );

        return NextResponse.json({ 
            message: 'School-wise order created successfully', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('Create error:', error);
        return NextResponse.json({ error: 'Failed to create school-wise order' }, { status: 500 });
    }
}
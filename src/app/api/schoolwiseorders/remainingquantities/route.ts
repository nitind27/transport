import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// GET - Fetch school-wise orders with proper filtering logic
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const companyId = searchParams.get('company_id');

        // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
        let userFilter = '';
        const userParams: string[] = [];
        if (userId && userId !== '1') {
            userFilter = 'AND s.user_id = ?';
            userParams.push(userId);
        }

        // Build WHERE clause for company_id filtering
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId) {
            companyFilter = 'AND s.company_id = ?';
            companyParams.push(companyId);
        }

        // Combine all parameters
        const allParams = [...userParams, ...companyParams];

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
                -- Parse original items_data from school_wise_order_details
                swo.items_data as original_items_data,
                -- Calculate remaining quantities by subtracting dispatched quantities
                CASE 
                    WHEN dd.school_id IS NOT NULL 
                      AND dd.order_id = swo.order_id 
                      AND dd.school_id = swo.school_id
                      AND dd.class_range = swo.class_range
                      AND dd.status = 'Active'
                    THEN 
                        -- Calculate remaining quantities for each item
                        JSON_OBJECT(
                            'तांदुळ', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.तांदुळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'तांदुळ' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'मुंगदाळ', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मुंगदाळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मुंगदाळ' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'मसूरदाळ', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मसूरदाळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मसूरदाळ' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'तूरदाळ', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.तूरदाळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'तूरदाळ' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'हरभरा', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.हरभरा')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'हरभरा' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'चवळी', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.चवळी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'चवळी' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'मटकी', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मटकी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मटकी' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'मुग', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मुग')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मुग' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'वाटाणा', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.वाटाणा')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'वाटाणा' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'सोया वडी', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.सोया वडी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'सोया वडी' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'मसाला', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मसाला')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मसाला' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'सोया तेल', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.सोया तेल')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'सोया तेल' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'हळद', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.हळद')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'हळद' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'मीठ', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मीठ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मीठ' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'मोहरी', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मोहरी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मोहरी' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'चना', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.चना')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'चना' THEN dd.qty_dispatch ELSE 0 END), 0)),
                            'जीरा', GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.जीरा')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'जीरा' THEN dd.qty_dispatch ELSE 0 END), 0))
                        )
                    ELSE 
                        -- If not dispatched, use original quantities
                        swo.items_data
                END as remaining_quantities,
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
            ${userFilter}
            ${companyFilter}
            GROUP BY swo.id, swo.order_id, swo.school_id, swo.class_range
            HAVING 
                -- Show only if not dispatched at all
                (is_dispatched = 0)
                OR 
                -- Or if dispatched but has remaining quantities (not all items fully dispatched)
                (is_dispatched = 1 AND (
                    GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.तांदुळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'तांदुळ' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मुंगदाळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मुंगदाळ' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मसूरदाळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मसूरदाळ' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.तूरदाळ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'तूरदाळ' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.हरभरा')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'हरभरा' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.चवळी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'चवळी' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मटकी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मटकी' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मुग')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मुग' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.वाटाणा')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'वाटाणा' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.सोया वडी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'सोया वडी' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मसाला')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मसाला' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.सोया तेल')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'सोया तेल' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.हळद')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'हळद' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मीठ')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मीठ' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.मोहरी')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'मोहरी' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.चना')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'चना' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                    OR GREATEST(0, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(swo.items_data, '$.जीरा')), 0) - COALESCE(SUM(CASE WHEN dd.item_name = 'जीरा' THEN dd.qty_dispatch ELSE 0 END), 0)) > 0
                ))
            ORDER BY s.schoolname, swo.class_range, swo.created_at DESC
        `, allParams);
        
        console.log('Total rows fetched:', rows.length);
        
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch remaining quantities' }, { status: 500 });
    }
}
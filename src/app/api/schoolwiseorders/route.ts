import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// GET - Fetch all school-wise order details (filtered by user_id/company_id)
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');
        const companyId = searchParams.get('company_id');

        console.log('School Wise Orders API - Request params:', { userId, companyId, url: req.url });

        // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
        let userFilter = '';
        const userParams: string[] = [];
        if (userId && userId.trim() !== '' && userId !== '1') {
            userFilter = 'AND sd.user_id = ?';
            userParams.push(userId.trim());
        }

        // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId && companyId.trim() !== '') {
            companyFilter = 'AND sd.company_id = ?';
            companyParams.push(companyId.trim());
        }

        // Combine all parameters
        const allParams = [...userParams, ...companyParams];

        console.log('School Wise Orders API - Filters:', { 
            userFilter, 
            companyFilter, 
            userParams, 
            companyParams,
            allParams 
        });

        const query = `
            SELECT 
                swo.*,
                zod.order_no,
                zod.no_of_days,
                zod.period,
                zod.financial_year,
                sd.schoolname,
                sd.udaisno
            FROM school_wise_order_details swo
            LEFT JOIN zp_order_details zod ON swo.order_id = zod.id
            LEFT JOIN schooldata sd ON swo.school_id = sd.schoolid
            WHERE 1=1
                ${userFilter}
                ${companyFilter}
            ORDER BY swo.created_at DESC
        `;

        console.log('School Wise Orders API - Query:', query);
        console.log('School Wise Orders API - Params:', allParams);

        const [rows] = await pool.query<RowDataPacket[]>(
            query, 
            allParams.length > 0 ? allParams : undefined
        );
        
        console.log('School Wise Orders API - Query success, rows:', rows.length);
        return NextResponse.json(rows);
    } catch (error: unknown) {
        console.error('School Wise Orders API - Fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ 
            error: 'Failed to fetch data',
            message: errorMessage
        }, { status: 500 });
    }
}

interface SchoolWiseOrderRequest {
    order_id: number;
    school_id: number;
    class_range: string;
    items_data: Record<string, number>;
    total_weight?: number;
    patsankhya?: number;
    uniq_id?: string | null;
    user_id?: string;
    company_id?: string;
}

// POST - Create new school-wise order detail
export async function POST(request: Request) {
    let requestData: SchoolWiseOrderRequest | null = null;
    try {
        requestData = await request.json() as SchoolWiseOrderRequest;
        const { order_id, school_id, class_range, items_data, total_weight, patsankhya, uniq_id, user_id, company_id } = requestData;

        if (!order_id || !school_id || !class_range || !items_data) {
            return NextResponse.json(
                { error: 'Order ID, School ID, Class Range, and Items Data are required' },
                { status: 400 }
            );
        }

        console.log('School Wise Orders API - POST Request:', { 
            order_id, 
            school_id, 
            class_range, 
            user_id, 
            company_id,
            hasItemsData: !!items_data 
        });

        // Build INSERT query dynamically based on available columns
        let insertColumns = 'order_id, school_id, class_range, patsankhya, items_data, total_weight, uniq_id, status';
        let insertValues = '?, ?, ?, ?, ?, ?, ?, ?';
        const insertParams: (string | number | null)[] = [
            order_id, 
            school_id, 
            class_range, 
            Number(patsankhya) || 0, 
            JSON.stringify(items_data), 
            total_weight || 0, 
            uniq_id || null,
            'Active'
        ];

        // Add user_id and company_id if provided
        if (user_id && user_id.trim() !== '') {
            insertColumns += ', user_id';
            insertValues += ', ?';
            insertParams.push(user_id.trim());
        }
        if (company_id && company_id.trim() !== '') {
            insertColumns += ', company_id';
            insertValues += ', ?';
            insertParams.push(company_id.trim());
        }

        console.log('School Wise Orders API - INSERT Query:', {
            columns: insertColumns,
            values: insertValues,
            paramsCount: insertParams.length
        });

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO school_wise_order_details (${insertColumns}) 
             VALUES (${insertValues})`,
            insertParams
        );

        console.log('School Wise Orders API - Insert successful, ID:', result.insertId);

        return NextResponse.json({ 
            message: 'School-wise order detail created successfully', 
            id: result.insertId 
        });
    } catch (error: unknown) {
        console.error('School Wise Orders API - Creation error:', error);
        const errorObj = error instanceof Error ? error : { message: 'Unknown error' };
        
        // If error is due to missing columns, try insert without user_id/company_id
        if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.includes('Unknown column')) {
            try {
                if (!requestData) {
                    requestData = await request.json() as SchoolWiseOrderRequest;
                }
                const { order_id, school_id, class_range, items_data, total_weight, patsankhya, uniq_id } = requestData;
                
                console.log('School Wise Orders API - Retrying without user_id/company_id');
                
                const [result] = await pool.query<ResultSetHeader>(
                    `INSERT INTO school_wise_order_details (order_id, school_id, class_range, patsankhya, items_data, total_weight, uniq_id, status) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')`,
                    [order_id, school_id, class_range, Number(patsankhya) || 0, JSON.stringify(items_data), total_weight || 0, uniq_id || null]
                );
                
                return NextResponse.json({ 
                    message: 'School-wise order detail created successfully (without user_id/company_id)', 
                    id: result.insertId 
                });
            } catch (retryError) {
                console.error('School Wise Orders API - Retry creation error:', retryError);
                return NextResponse.json(
                    { error: 'Failed to create school-wise order detail' },
                    { status: 500 }
                );
            }
        }
        
        const errorMessage = errorObj instanceof Error ? errorObj.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to create school-wise order detail', message: errorMessage },
            { status: 500 }
        );
    }
}

// PUT - Update school-wise order detail
export async function PUT(request: Request) {
    try {
        const { id, order_id, school_id, class_range, items_data, total_weight, patsankhya } = await request.json();

        if (!id || !order_id || !school_id || !class_range || !items_data) {
            return NextResponse.json(
                { error: 'ID, Order ID, School ID, Class Range, and Items Data are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE school_wise_order_details 
             SET order_id = ?, school_id = ?, class_range = ?, patsankhya = ?, items_data = ?, total_weight = ?, updated_at = NOW()
             WHERE id = ?`,
            [order_id, school_id, class_range, Number(patsankhya) || 0, JSON.stringify(items_data), total_weight || 0, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'School-wise order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'School-wise order detail updated successfully'
        });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'Failed to update school-wise order detail' },
            { status: 500 }
        );
    }
}

// PATCH - Toggle status (soft delete) - supports single id OR group_id bulk
// PATCH - Toggle status (soft delete) - supports single id OR uniq_id bulk
export async function PATCH(request: Request) {
    try {
        const { id, status, uniq_id } = await request.json();

        if ((!id && !uniq_id) || !status) {
            return NextResponse.json({ error: 'ID or uniq_id and status are required' }, { status: 400 });
        }

        if (uniq_id) {
            const [result] = await pool.query<ResultSetHeader>(
                `UPDATE school_wise_order_details 
                 SET status = ?, updated_at = NOW()
                 WHERE uniq_id = ?`,
                [status, uniq_id]
            );
            return NextResponse.json({ message: 'Status updated for group successfully', affected: result.affectedRows });
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE school_wise_order_details 
             SET status = ?, updated_at = NOW()
             WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'School-wise order detail not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Status updated successfully' });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
// DELETE - Hard delete (optional)
export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: 'ID is required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM school_wise_order_details WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'School-wise order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'School-wise order detail deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete school-wise order detail' },
            { status: 500 }
        );
    }
}
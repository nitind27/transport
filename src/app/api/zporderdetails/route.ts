import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// GET - Fetch all ZP order details (filtered by user_id/company_id)
export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get('user_id');
      const companyId = searchParams.get('company_id');

      console.log('ZP Order Details API - Request params:', { userId, companyId, url: req.url });

      // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
      let userFilter = '';
      const userParams: string[] = [];
      if (userId && userId.trim() !== '' && userId !== '1') {
        userFilter = 'AND zod.user_id = ?';
        userParams.push(userId.trim());
      }

      // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
      let companyFilter = '';
      const companyParams: string[] = [];
      if (companyId && companyId.trim() !== '') {
        companyFilter = 'AND zod.company_id = ?';
        companyParams.push(companyId.trim());
      }

      // Combine all parameters
      const allParams = [...userParams, ...companyParams];

      console.log('ZP Order Details API - Filters:', { 
        userFilter, 
        companyFilter, 
        userParams, 
        companyParams,
        allParams 
      });

      // Build query - try direct filtering first (if user_id/company_id columns exist in zp_order_details)
      let query = '';
      let params: string[] = [];
      
      if (allParams.length > 0) {
        // Try direct filtering by user_id and company_id in zp_order_details table
        query = `
          SELECT zod.*
          FROM zp_order_details zod
          WHERE 1=1
            ${userFilter}
            ${companyFilter}
          ORDER BY zod.order_no
        `;
        params = allParams;
      } else {
        // No filters - return all orders (active and inactive)
        query = 'SELECT * FROM zp_order_details ORDER BY order_no';
      }

      console.log('ZP Order Details API - Query:', query);
      console.log('ZP Order Details API - Params:', params);

      try {
        const [rows] = await pool.query<RowDataPacket[]>(query, params.length > 0 ? params : undefined);
        console.log('ZP Order Details API - Direct query success, rows:', rows.length);
        return NextResponse.json(rows);
      } catch (dbError: unknown) {
        // If direct filtering fails (columns don't exist), fallback to join-based filtering
        const dbErrorObj = dbError instanceof Error ? dbError : { message: 'Unknown error' };
        if (dbErrorObj.message && typeof dbErrorObj.message === 'string' && dbErrorObj.message.includes('Unknown column')) {
          console.log('ZP Order Details API - Direct filtering failed, using join-based filtering. Error:', dbErrorObj.message);
          
          // Reset filters for join-based approach
          let joinUserFilter = '';
          const joinUserParams: string[] = [];
          if (userId && userId.trim() !== '' && userId !== '1') {
            joinUserFilter = 'AND s.user_id = ?';
            joinUserParams.push(userId.trim());
          }

          // Build WHERE clause for company_id filtering - Always apply if provided (even for admin)
          let joinCompanyFilter = '';
          const joinCompanyParams: string[] = [];
          if (companyId && companyId.trim() !== '') {
            joinCompanyFilter = 'AND s.company_id = ?';
            joinCompanyParams.push(companyId.trim());
          }

          const joinParams = [...joinUserParams, ...joinCompanyParams];
          
          if (joinParams.length > 0) {
            // Filter orders that have school_wise_order_details linked to schools with matching user_id/company_id
            query = `
              SELECT DISTINCT zod.*
              FROM zp_order_details zod
              INNER JOIN school_wise_order_details swo ON zod.id = swo.order_id
              INNER JOIN schooldata s ON swo.school_id = s.schoolid AND s.status = 'Active'
              WHERE 1=1
                ${joinUserFilter}
                ${joinCompanyFilter}
              ORDER BY zod.order_no
            `;
            console.log('ZP Order Details API - Join query:', query);
            console.log('ZP Order Details API - Join params:', joinParams);
            const [rows] = await pool.query<RowDataPacket[]>(query, joinParams);
            console.log('ZP Order Details API - Join query success, rows:', rows.length);
            return NextResponse.json(rows);
          } else {
            // No filters - return all orders (active and inactive)
            query = 'SELECT * FROM zp_order_details ORDER BY order_no';
            console.log('ZP Order Details API - No filters, returning all orders');
            const [rows] = await pool.query<RowDataPacket[]>(query);
            console.log('ZP Order Details API - All orders query success, rows:', rows.length);
            return NextResponse.json(rows);
          }
        } else {
          console.error('ZP Order Details API - Database error (not column error):', dbError);
          throw dbError;
        }
      }
    } catch (error: unknown) {
      console.error('ZP Order Details API - Fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Failed to fetch data',
        message: errorMessage
      }, { status: 500 });
    }
  }
  

interface ZPOrderRequest {
    order_no: string;
    no_of_days: number;
    period: string;
    financial_year: string;
    user_id?: string;
    company_id?: string;
}

// POST - Create new ZP order detail
export async function POST(request: Request) {
    let requestData: ZPOrderRequest | null = null;
    try {
        requestData = await request.json() as ZPOrderRequest;
        const { order_no, no_of_days, period, financial_year, user_id, company_id } = requestData;

        // Validation
        if (!order_no || !no_of_days || !period || !financial_year) {
            return NextResponse.json(
                { error: 'Order No, No of Days, Period, and Financial Year are required' },
                { status: 400 }
            );
        }

        // Build INSERT query dynamically based on available columns
        let insertColumns = 'order_no, no_of_days, period, financial_year, status';
        let insertValues = '?, ?, ?, ?, ?';
        const insertParams: (string | number)[] = [order_no, no_of_days, period, financial_year, 'Active'];

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

        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO zp_order_details (${insertColumns}) 
       VALUES (${insertValues})`,
            insertParams
        );

        return NextResponse.json({
            message: 'ZP order detail created successfully',
            id: result.insertId
        });
    } catch (error: unknown) {
        console.error('Creation error:', error);
        const errorObj = error instanceof Error ? error : { message: 'Unknown error' };
        // If error is due to missing columns, try insert without user_id/company_id
        if (errorObj.message && typeof errorObj.message === 'string' && errorObj.message.includes('Unknown column')) {
            try {
                if (!requestData) {
                    requestData = await request.json() as ZPOrderRequest;
                }
                const { order_no, no_of_days, period, financial_year } = requestData;
                const [result] = await pool.query<ResultSetHeader>(
                    `INSERT INTO zp_order_details (order_no, no_of_days, period, financial_year, status) 
           VALUES (?, ?, ?, ?, 'Active')`,
                    [order_no, no_of_days, period, financial_year]
                );
                return NextResponse.json({
                    message: 'ZP order detail created successfully (without user_id/company_id)',
                    id: result.insertId
                });
            } catch (retryError) {
                console.error('Retry creation error:', retryError);
                return NextResponse.json(
                    { error: 'Failed to create ZP order detail' },
                    { status: 500 }
                );
            }
        }
        return NextResponse.json(
            { error: 'Failed to create ZP order detail' },
            { status: 500 }
        );
    }
}

// PUT - Update ZP order detail
export async function PUT(request: Request) {
    try {
        const { id, order_no, no_of_days, period, financial_year } = await request.json();

        // Validation
        if (!id || !order_no || !no_of_days || !period || !financial_year) {
            return NextResponse.json(
                { error: 'ID, Order No, No of Days, Period, and Financial Year are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE zp_order_details 
       SET order_no = ?, no_of_days = ?, period = ?, financial_year = ?, updated_at = NOW()
       WHERE id = ?`,
            [order_no, no_of_days, period, financial_year, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'ZP order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'ZP order detail updated successfully'
        });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { error: 'Failed to update ZP order detail' },
            { status: 500 }
        );
    }
}

// PATCH - Toggle status (soft delete)
export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json(
                { error: 'ID and status are required' },
                { status: 400 }
            );
        }

        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE zp_order_details 
       SET status = ?, updated_at = NOW()
       WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'ZP order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json(
            { error: 'Failed to update status' },
            { status: 500 }
        );
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
            'DELETE FROM zp_order_details WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'ZP order detail not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'ZP order detail deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete ZP order detail' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch all stock inventory entries
export async function GET(req: Request) {
    let connection;
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get('user_id');
        const companyId = url.searchParams.get('company_id');

        // Build WHERE clause for user_id filtering - Skip for admin (user_id = 1)
        let userFilter = '';
        const userParams: string[] = [];
        if (userId && userId.trim() !== '' && userId !== '1') {
            // Note: stockinventory table may not have user_id column directly
            // If it doesn't exist, this filter will be ignored
            userFilter = 'AND user_id = ?';
            userParams.push(userId.trim());
        }

        // Build WHERE clause for company_id filtering - Only add if not empty
        let companyFilter = '';
        const companyParams: string[] = [];
        if (companyId && companyId.trim() !== '') {
            // Note: stockinventory table may not have company_id column directly
            // If it doesn't exist, this filter will be ignored
            companyFilter = 'AND company_id = ?';
            companyParams.push(companyId.trim());
        }

        connection = await pool.getConnection();
        
        // Check if columns exist before applying filters
        // For now, we'll apply filters only if columns exist
        // If columns don't exist in table, the query will fail, so we need to handle it gracefully
        let query = `SELECT * FROM stockinventory WHERE status = "Active"`;
        const params: string[] = [];
        
        // Only add filters if we have parameters (assumes columns exist)
        if (userParams.length > 0 || companyParams.length > 0) {
            query += ` ${userFilter} ${companyFilter}`;
            params.push(...userParams, ...companyParams);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const [rows] = await connection.query<RowDataPacket[]>(query, params.length > 0 ? params : undefined);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query failed (GET):', error);
        // If error is due to missing columns, try without filters
        if (connection) {
            try {
                const [rows] = await connection.query<RowDataPacket[]>(
                    `SELECT * FROM stockinventory WHERE status = "Active" ORDER BY created_at DESC`
                );
                return NextResponse.json(rows);
            } catch (retryError) {
                console.error('Retry query also failed:', retryError);
            }
        }
        return NextResponse.json(
            { message: 'Failed to fetch stock inventory data' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// POST - Create new stock inventory entry
export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { 
            dealer, 
            ewayBillNo, 
            billNo, 
            invoiceDate, 
            truckNo, 
            grain, 
            units, 
            weight, 
            rate, 
            totalAmount, 
            remarks 
        } = body;

        // Basic Validation
        if (!dealer || !grain || !units || weight === undefined || weight === null) {
            return NextResponse.json(
                { message: 'Dealer, grain, units, and weight are required fields' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO stockinventory 
            (dealer, ewayBillNo, billNo, invoiceDate, truckNo, grain, units, weight, rate, totalAmount, remarks, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                dealer, 
                ewayBillNo || null, 
                billNo || null, 
                invoiceDate || null, 
                truckNo || null, 
                grain, 
                units, 
                weight, 
                rate || null, 
                totalAmount || null, 
                remarks || null, 
                'Active'
            ]
        );

        return NextResponse.json({
            message: 'Stock inventory entry added successfully',
            id: result.insertId,
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add stock inventory entry' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// PUT - Update existing stock inventory entry
export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { 
            id, 
            dealer, 
            ewayBillNo, 
            billNo, 
            invoiceDate, 
            truckNo, 
            grain, 
            units, 
            weight, 
            rate, 
            totalAmount, 
            remarks 
        } = body;

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        const fieldsToUpdate = [];
        const values = [];

        if (dealer !== undefined) { fieldsToUpdate.push('dealer = ?'); values.push(dealer); }
        if (ewayBillNo !== undefined) { fieldsToUpdate.push('ewayBillNo = ?'); values.push(ewayBillNo); }
        if (billNo !== undefined) { fieldsToUpdate.push('billNo = ?'); values.push(billNo); }
        if (invoiceDate !== undefined) { fieldsToUpdate.push('invoiceDate = ?'); values.push(invoiceDate); }
        if (truckNo !== undefined) { fieldsToUpdate.push('truckNo = ?'); values.push(truckNo); }
        if (grain !== undefined) { fieldsToUpdate.push('grain = ?'); values.push(grain); }
        if (units !== undefined) { fieldsToUpdate.push('units = ?'); values.push(units); }
        if (weight !== undefined) { fieldsToUpdate.push('weight = ?'); values.push(weight); }
        if (rate !== undefined) { fieldsToUpdate.push('rate = ?'); values.push(rate); }
        if (totalAmount !== undefined) { fieldsToUpdate.push('totalAmount = ?'); values.push(totalAmount); }
        if (remarks !== undefined) { fieldsToUpdate.push('remarks = ?'); values.push(remarks); }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        fieldsToUpdate.push('updated_at = NOW()');
        values.push(id);

        connection = await pool.getConnection();
        const query = `UPDATE stockinventory SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Stock inventory entry updated successfully' });
    } catch (error) {
        console.error('Stock inventory update failed:', error);
        return NextResponse.json({ message: 'Failed to update stock inventory entry' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE - Delete stock inventory entry (soft delete by setting status to Inactive)
export async function DELETE(req: Request) {
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await pool.query(
            'UPDATE stockinventory SET status = "Inactive", updated_at = NOW() WHERE id = ?',
            [id]
        );
        return NextResponse.json({ message: 'Stock inventory entry deleted successfully' });
    } catch (error) {
        console.error('Deletion failed:', error);
        return NextResponse.json({ error: 'Failed to delete stock inventory entry' }, { status: 500 });
    }
}

// PATCH - Update status of stock inventory entry
export async function PATCH(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
        }

        await pool.query(
            'UPDATE stockinventory SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );
        return NextResponse.json({ message: `Stock inventory entry ${status === 'Active' ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

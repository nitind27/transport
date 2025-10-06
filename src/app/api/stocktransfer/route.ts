import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch all stock transfer entries or check available stock
export async function GET(req: Request) {
    let connection;
    try {
        const url = new URL(req.url);
        const itemGrain = url.searchParams.get('itemGrain');
        
        connection = await pool.getConnection();
        
        // If itemGrain parameter is provided, check stock availability
        if (itemGrain) {
            const stockCheck = await checkAvailableStock(itemGrain, 0);
            
            return NextResponse.json({
                itemGrain: itemGrain,
                availableWeight: stockCheck.availableWeight,
                message: stockCheck.message
            });
        }
        
        // Otherwise, fetch all stock transfer entries
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT 
                id,
                invoiceDate,
                itemGrain,
                weight,
                destination,
                remarks,
                tpNo,
                truckNo,
                status,
                created_at,
                updated_at
            FROM stocktransfer 
            WHERE status = "Active" 
            ORDER BY created_at DESC`
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query failed (GET):', error);
        return NextResponse.json(
            { message: 'Failed to fetch stock transfer data' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// Function to generate next TP number
async function generateNextTpNo(): Promise<string> {
    try {
        // Get the highest TP number from active records
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT MAX(CAST(SUBSTRING(tpNo, 3) AS UNSIGNED)) as maxTpNo 
             FROM stocktransfer 
             WHERE status = "Active" AND tpNo LIKE 'TP%'`
        );
        
        const maxTpNo = rows[0]?.maxTpNo || 0;
        const nextTpNo = maxTpNo + 1;
        
        return `TP${nextTpNo.toString().padStart(4, '0')}`; // TP0001, TP0002, etc.
    } catch (error) {
        console.error('Error generating TP number:', error);
        // Fallback: use timestamp if there's an error
        return `TP${Date.now().toString().slice(-4)}`;
    }
}

// Function to check available stock for an item
async function checkAvailableStock(itemGrain: string, requestedWeight: number): Promise<{available: boolean, availableWeight: number, message: string}> {
    try {
        // Query balanceQty using joined aggregations
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
                (COALESCE(si.inwardQty, 0) - COALESCE(dd.dispatchQty, 0) - COALESCE(st.transferQty, 0) - COALESCE(sm.damageQty, 0)) AS balanceQty
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
            ) sm ON LOWER(TRIM(sm.itemGrain)) COLLATE utf8mb4_unicode_ci = LOWER(TRIM(ig.name)) COLLATE utf8mb4_unicode_ci
            WHERE LOWER(TRIM(ig.name)) = LOWER(TRIM(?)) COLLATE utf8mb4_unicode_ci
            `,
            [itemGrain]
        );

        const balanceQty = rows[0]?.balanceQty ?? 0;

        console.log(`Stock Check for ${itemGrain}: Balance Quantity: ${balanceQty}`);

        if (balanceQty <= 0) {
            return {
                available: false,
                availableWeight: 0,
                message: `No stock available for ${itemGrain}.`
            };
        }

        if (requestedWeight > balanceQty) {
            return {
                available: false,
                availableWeight: balanceQty,
                message: `Insufficient stock for ${itemGrain}. Available: ${balanceQty}, Requested: ${requestedWeight}`
            };
        }

        return {
            available: true,
            availableWeight: balanceQty,
            message: `Stock available for ${itemGrain}. Available: ${balanceQty}, Requested: ${requestedWeight}`
        };

    } catch (error) {
        console.error('Error checking stock:', error);
        return {
            available: false,
            availableWeight: 0,
            message: 'Error checking stock availability'
        };
    }
}


// POST - Create new stock transfer entry
export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { 
            invoiceDate, 
            itemGrain, 
            weight, 
            destination, 
            remarks, 
            truckNo 
        } = body;

        // Basic Validation (removed tpNo from required fields since it's auto-generated)
        if (!itemGrain || !weight || !destination || !truckNo) {
            return NextResponse.json(
                { message: 'Item/Grain, Weight, Destination, and Truck No are required fields' },
                { status: 400 }
            );
        }

        // Validate weight is a positive number
        if (Number(weight) <= 0) {
            return NextResponse.json(
                { message: 'Weight must be a positive number' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        
        // Check stock availability before proceeding
        const stockCheck = await checkAvailableStock(itemGrain, Number(weight));
        
        if (!stockCheck.available) {
            return NextResponse.json(
                { 
                    message: stockCheck.message,
                    availableWeight: stockCheck.availableWeight,
                    requestedWeight: Number(weight)
                },
                { status: 400 }
            );
        }
        
        // Generate auto TP number
        const autoTpNo = await generateNextTpNo();

        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO stocktransfer 
            (invoiceDate, itemGrain, weight, destination, remarks, tpNo, truckNo, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                invoiceDate || null, 
                itemGrain, 
                Number(weight), 
                destination, 
                remarks || null, 
                autoTpNo, 
                truckNo, 
                'Active'
            ]
        );

        return NextResponse.json({
            message: 'Stock transfer entry added successfully',
            id: result.insertId,
            tpNo: autoTpNo,
            stockInfo: stockCheck.message
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add stock transfer entry' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// PUT - Update existing stock transfer entry
export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { 
            id, 
            invoiceDate, 
            itemGrain, 
            weight, 
            destination, 
            remarks, 
            truckNo 
        } = body;

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        // Validate weight if provided
        if (weight !== undefined && Number(weight) <= 0) {
            return NextResponse.json(
                { message: 'Weight must be a positive number' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        
        // If weight or itemGrain is being updated, check stock availability
        if (weight !== undefined || itemGrain !== undefined) {
            // Get current record to determine what values to use for stock check
            const [currentRecord] = await connection.query<RowDataPacket[]>(
                'SELECT itemGrain, weight FROM stocktransfer WHERE id = ?',
                [id]
            );
            
            const currentItemGrain = itemGrain || currentRecord[0]?.itemGrain;
            const currentWeight = weight !== undefined ? Number(weight) : currentRecord[0]?.weight;
            
            // For updates, we need to exclude the current record's weight from transferred calculation
            // Get total stock weight for the item from stockinventory
            const [stockRows] = await connection.query<RowDataPacket[]>(
                `SELECT COALESCE(SUM(weight), 0) as totalStock 
                 FROM stockinventory 
                 WHERE grain = ? AND status = "Active"`,
                [currentItemGrain]
            );
            
            const totalStock = stockRows[0]?.totalStock || 0;
            
            // Get total transferred weight excluding current record
            const [transferRows] = await connection.query<RowDataPacket[]>(
                `SELECT COALESCE(SUM(weight), 0) as totalTransferred 
                 FROM stocktransfer 
                 WHERE itemGrain = ? AND status = "Active" AND id != ?`,
                [currentItemGrain, id]
            );
            
            const totalTransferred = transferRows[0]?.totalTransferred || 0;
            const availableWeight = totalStock - totalTransferred;
            
            console.log(`Update Stock Check for ${currentItemGrain}: Total Stock: ${totalStock}, Transferred (excluding current): ${totalTransferred}, Available: ${availableWeight}, Requested: ${currentWeight}`);
            
            if (availableWeight <= 0) {
                return NextResponse.json(
                    { 
                        message: `No stock available for ${currentItemGrain}. Total stock: ${totalStock}, Already transferred: ${totalTransferred}`,
                        availableWeight: 0,
                        requestedWeight: currentWeight
                    },
                    { status: 400 }
                );
            }
            
            if (currentWeight > availableWeight) {
                return NextResponse.json(
                    { 
                        message: `Insufficient stock for ${currentItemGrain}. Available: ${availableWeight}, Requested: ${currentWeight}`,
                        availableWeight: availableWeight,
                        requestedWeight: currentWeight
                    },
                    { status: 400 }
                );
            }
        }

        const fieldsToUpdate = [];
        const values = [];

        if (invoiceDate !== undefined) { fieldsToUpdate.push('invoiceDate = ?'); values.push(invoiceDate); }
        if (itemGrain !== undefined) { fieldsToUpdate.push('itemGrain = ?'); values.push(itemGrain); }
        if (weight !== undefined) { fieldsToUpdate.push('weight = ?'); values.push(Number(weight)); }
        if (destination !== undefined) { fieldsToUpdate.push('destination = ?'); values.push(destination); }
        if (remarks !== undefined) { fieldsToUpdate.push('remarks = ?'); values.push(remarks); }
        if (truckNo !== undefined) { fieldsToUpdate.push('truckNo = ?'); values.push(truckNo); }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        fieldsToUpdate.push('updated_at = NOW()');
        values.push(id);

        const query = `UPDATE stocktransfer SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Stock transfer entry updated successfully' });
    } catch (error) {
        console.error('Stock transfer update failed:', error);
        return NextResponse.json({ message: 'Failed to update stock transfer entry' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE - Delete stock transfer entry (soft delete by setting status to Inactive)
export async function DELETE(req: Request) {
    let connection;
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.query(
            'UPDATE stocktransfer SET status = "Inactive", updated_at = NOW() WHERE id = ?',
            [id]
        );
        
        return NextResponse.json({ message: 'Stock transfer entry deleted successfully' });
    } catch (error) {
        console.error('Deletion failed:', error);
        return NextResponse.json({ error: 'Failed to delete stock transfer entry' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// PATCH - Update status of stock transfer entry (Active/Inactive)
export async function PATCH(request: Request) {
    let connection;
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
        }

        if (!['Active', 'Inactive'].includes(status)) {
            return NextResponse.json({ error: 'Status must be either Active or Inactive' }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.query(
            'UPDATE stocktransfer SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );
        
        return NextResponse.json({ 
            message: `Stock transfer entry ${status === 'Active' ? 'activated' : 'deactivated'} successfully` 
        });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

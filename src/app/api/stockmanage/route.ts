import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// GET - Fetch all stock management entries or check available stock
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
                availableQuantity: stockCheck.availableQuantity,
                message: stockCheck.message
            });
        }
        
        // Otherwise, fetch all stock management entries
        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT 
                id,
                invoiceDate,
                itemGrain,
                quantity,
                remarks,
                status,
                created_at,
                updated_at
            FROM stockmanage 
            WHERE status = "Active" 
            ORDER BY created_at DESC`
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database query failed (GET):', error);
        return NextResponse.json(
            { message: 'Failed to fetch stock management data' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// Function to check available stock for an item
async function checkAvailableStock(itemGrain: string, requestedQuantity: number): Promise<{available: boolean, availableQuantity: number, message: string}> {
    try {
        // Get total stock quantity for the item from stockinventory
        const [stockRows] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(weight), 0) as totalStock 
             FROM stockinventory 
             WHERE grain = ? AND status = "Active"`,
            [itemGrain]
        );
        
        const totalStock = stockRows[0]?.totalStock || 0;
        
        // Get total damaged quantity for the item from stockmanage
        const [damageRows] = await pool.query<RowDataPacket[]>(
            `SELECT COALESCE(SUM(quantity), 0) as totalDamaged 
             FROM stockmanage 
             WHERE itemGrain = ? AND status = "Active"`,
            [itemGrain]
        );
        
        const totalDamaged = damageRows[0]?.totalDamaged || 0;
        
        // Calculate available quantity
        const availableQuantity = totalStock - totalDamaged;
        
        console.log(`Stock Check for ${itemGrain}: Total Stock: ${totalStock}, Damaged: ${totalDamaged}, Available: ${availableQuantity}`);
        
        if (availableQuantity <= 0) {
            return {
                available: false,
                availableQuantity: 0,
                message: `No stock available for ${itemGrain}. Total stock: ${totalStock}, Already damaged: ${totalDamaged}`
            };
        }
        
        if (requestedQuantity > availableQuantity) {
            return {
                available: false,
                availableQuantity: availableQuantity,
                message: `Insufficient stock for ${itemGrain}. Available: ${availableQuantity}, Requested: ${requestedQuantity}`
            };
        }
        
        return {
            available: true,
            availableQuantity: availableQuantity,
            message: `Stock available for ${itemGrain}. Available: ${availableQuantity}, Requested: ${requestedQuantity}`
        };
        
    } catch (error) {
        console.error('Error checking stock:', error);
        return {
            available: false,
            availableQuantity: 0,
            message: 'Error checking stock availability'
        };
    }
}

// POST - Create new stock management entry
export async function POST(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { 
            invoiceDate, 
            itemGrain, 
            quantity, 
            remarks 
        } = body;

        // Basic Validation
        if (!itemGrain || !quantity) {
            return NextResponse.json(
                { message: 'Item/Grain and Quantity are required fields' },
                { status: 400 }
            );
        }

        // Validate quantity is a positive number
        if (Number(quantity) <= 0) {
            return NextResponse.json(
                { message: 'Quantity must be a positive number' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        
        // Check stock availability before proceeding
        const stockCheck = await checkAvailableStock(itemGrain, Number(quantity));
        
        if (!stockCheck.available) {
            return NextResponse.json(
                { 
                    message: stockCheck.message,
                    availableQuantity: stockCheck.availableQuantity,
                    requestedQuantity: Number(quantity)
                },
                { status: 400 }
            );
        }

        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO stockmanage 
            (invoiceDate, itemGrain, quantity, remarks, status, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                invoiceDate || null, 
                itemGrain, 
                Number(quantity), 
                remarks || null, 
                'Active'
            ]
        );

        return NextResponse.json({
            message: 'Stock management entry added successfully',
            id: result.insertId,
            stockInfo: stockCheck.message
        });
    } catch (error) {
        console.error('Database insert failed (POST):', error);
        return NextResponse.json(
            { message: 'Failed to add stock management entry' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

// PUT - Update existing stock management entry
export async function PUT(req: Request) {
    let connection;
    try {
        const body = await req.json();
        const { 
            id, 
            invoiceDate, 
            itemGrain, 
            quantity, 
            remarks 
        } = body;

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        // Validate quantity if provided
        if (quantity !== undefined && Number(quantity) <= 0) {
            return NextResponse.json(
                { message: 'Quantity must be a positive number' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        
        // If quantity or itemGrain is being updated, check stock availability
        if (quantity !== undefined || itemGrain !== undefined) {
            // Get current record to determine what values to use for stock check
            const [currentRecord] = await connection.query<RowDataPacket[]>(
                'SELECT itemGrain, quantity FROM stockmanage WHERE id = ?',
                [id]
            );
            
            const currentItemGrain = itemGrain || currentRecord[0]?.itemGrain;
            const currentQuantity = quantity !== undefined ? Number(quantity) : currentRecord[0]?.quantity;
            
            // For updates, we need to exclude the current record's quantity from damaged calculation
            // Get total stock quantity for the item from stockinventory
            const [stockRows] = await connection.query<RowDataPacket[]>(
                `SELECT COALESCE(SUM(weight), 0) as totalStock 
                 FROM stockinventory 
                 WHERE grain = ? AND status = "Active"`,
                [currentItemGrain]
            );
            
            const totalStock = stockRows[0]?.totalStock || 0;
            
            // Get total damaged quantity excluding current record
            const [damageRows] = await connection.query<RowDataPacket[]>(
                `SELECT COALESCE(SUM(quantity), 0) as totalDamaged 
                 FROM stockmanage 
                 WHERE itemGrain = ? AND status = "Active" AND id != ?`,
                [currentItemGrain, id]
            );
            
            const totalDamaged = damageRows[0]?.totalDamaged || 0;
            const availableQuantity = totalStock - totalDamaged;
            
            console.log(`Update Stock Check for ${currentItemGrain}: Total Stock: ${totalStock}, Damaged (excluding current): ${totalDamaged}, Available: ${availableQuantity}, Requested: ${currentQuantity}`);
            
            if (availableQuantity <= 0) {
                return NextResponse.json(
                    { 
                        message: `No stock available for ${currentItemGrain}. Total stock: ${totalStock}, Already damaged: ${totalDamaged}`,
                        availableQuantity: 0,
                        requestedQuantity: currentQuantity
                    },
                    { status: 400 }
                );
            }
            
            if (currentQuantity > availableQuantity) {
                return NextResponse.json(
                    { 
                        message: `Insufficient stock for ${currentItemGrain}. Available: ${availableQuantity}, Requested: ${currentQuantity}`,
                        availableQuantity: availableQuantity,
                        requestedQuantity: currentQuantity
                    },
                    { status: 400 }
                );
            }
        }

        const fieldsToUpdate = [];
        const values = [];

        if (invoiceDate !== undefined) { fieldsToUpdate.push('invoiceDate = ?'); values.push(invoiceDate); }
        if (itemGrain !== undefined) { fieldsToUpdate.push('itemGrain = ?'); values.push(itemGrain); }
        if (quantity !== undefined) { fieldsToUpdate.push('quantity = ?'); values.push(Number(quantity)); }
        if (remarks !== undefined) { fieldsToUpdate.push('remarks = ?'); values.push(remarks); }

        if (fieldsToUpdate.length === 0) {
            return NextResponse.json({ message: 'No fields provided for update' }, { status: 400 });
        }

        fieldsToUpdate.push('updated_at = NOW()');
        values.push(id);

        const query = `UPDATE stockmanage SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;

        await connection.query(query, values);

        return NextResponse.json({ message: 'Stock management entry updated successfully' });
    } catch (error) {
        console.error('Stock management update failed:', error);
        return NextResponse.json({ message: 'Failed to update stock management entry' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE - Delete stock management entry (soft delete by setting status to Inactive)
export async function DELETE(req: Request) {
    let connection;
    try {
        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        connection = await pool.getConnection();
        await connection.query(
            'UPDATE stockmanage SET status = "Inactive", updated_at = NOW() WHERE id = ?',
            [id]
        );
        
        return NextResponse.json({ message: 'Stock management entry deleted successfully' });
    } catch (error) {
        console.error('Deletion failed:', error);
        return NextResponse.json({ error: 'Failed to delete stock management entry' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// PATCH - Update status of stock management entry (Active/Inactive)
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
            'UPDATE stockmanage SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );
        
        return NextResponse.json({ 
            message: `Stock management entry ${status === 'Active' ? 'activated' : 'deactivated'} successfully` 
        });
    } catch (error) {
        console.error('Status update error:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
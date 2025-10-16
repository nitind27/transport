import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export async function generateDispatchCode(): Promise<string> {
  try {
    // Get the maximum dispatch_code from the database
    const [rows] = await pool.query<RowDataPacket[]>('SELECT MAX(CAST(dispatch_code AS UNSIGNED)) as maxCode FROM dispatch_details');
    const maxCode = rows[0]?.maxCode || 0;
    return String(maxCode + 1);
  } catch (error) {
    console.error('Error generating dispatch code:', error);
    // Fallback to timestamp if database query fails
    return String(Date.now());
  }
}

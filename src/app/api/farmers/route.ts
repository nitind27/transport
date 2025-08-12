// app/api/farmers/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import fs from 'fs';
import path from 'path';

// GET handler (existing)
export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM farmers where status = "Active"');
        const safeUsers = rows.map(user => ({ ...user }));
        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error('Database query failed:', error);
        return NextResponse.json(
            { message: 'Failed to fetch farmers' },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}



export async function POST(request: Request) {
    const formData = await request.formData();
    const farmerId = formData.get('farmer_id') as string;
    const files = formData.getAll('files') as File[];
    const files2 = formData.getAll('files2') as File[];
    const files3 = formData.getAll('files3') as File[];
    const files4 = formData.getAll('files4') as File[];
    const files5 = formData.getAll('files5') as File[];


    const updatableFields = [
        'name', 'adivasi', 'village_id', 'taluka_id', 'gat_no',
        'vanksetra', 'nivas_seti', 'aadhaar_no', 'contact_no',
        'email', 'kisan_id', 'schemes', 'documents', 'update_record', 'gender', 'dob', 'profile_photo', 'aadhaar_photo', 'compartment_number', 'schedule_j', 'gis', 'geo_photo'
    ];

    let connection;
    try {

        const tmpBasePath = path.join(process.cwd(), 'tmp', 'uploads');
        const farmerDocDir = path.join(tmpBasePath, 'farmersdocument');
        const schemeDocDir = path.join(tmpBasePath, 'schemedocument');
        const aadhaarDocDir = path.join(tmpBasePath, 'uploadaadhaar');
        const profileDocDir = path.join(tmpBasePath, 'uploadsprofile');
        const geophotoDir = path.join(tmpBasePath, 'geophotos');



        for (const dir of [farmerDocDir, schemeDocDir, aadhaarDocDir, profileDocDir, geophotoDir]) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }

        const newFarmerDocNames: string[] = [];
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;

            const safeFileName = `${originalFileName}`;
            const filePath = path.join(farmerDocDir, safeFileName);

            await fs.promises.writeFile(filePath, buffer);
            newFarmerDocNames.push(safeFileName);
        }

        const newSchemeDocNames: string[] = [];
        for (const file of files2) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;

            const safeFileName = `${originalFileName}`;
            const filePath = path.join(schemeDocDir, safeFileName);

            await fs.promises.writeFile(filePath, buffer);
            newSchemeDocNames.push(safeFileName);
        }

        const newAadhaarDocNames: string[] = [];
        for (const file of files4) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;

            const safeFileName = `${originalFileName}`;
            const filePath = path.join(aadhaarDocDir, safeFileName);

            await fs.promises.writeFile(filePath, buffer);
            newAadhaarDocNames.push(safeFileName);
        }

        const newProfileDocNames: string[] = [];
        for (const file of files3) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;

            const safeFileName = `${originalFileName}`;
            const filePath = path.join(profileDocDir, safeFileName);

            await fs.promises.writeFile(filePath, buffer);
            newProfileDocNames.push(safeFileName);
        }

        const geophotos: string[] = [];
        for (const file of files5) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const originalFileName = file.name;

            const safeFileName = `${originalFileName}`;
            const filePath = path.join(geophotoDir, safeFileName);

            await fs.promises.writeFile(filePath, buffer);
            geophotos.push(safeFileName);
        }

        connection = await pool.getConnection();

        const updateFields: string[] = [];
        const updateValues: (string | number)[] = [];

        for (const field of updatableFields) {
            const value = formData.get(field);
            if (value !== null && value !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(value.toString());
            }
        }

        if (updateFields.length > 0) {
            updateValues.push(farmerId);
            const updateQuery = `UPDATE farmers SET ${updateFields.join(', ')} WHERE farmer_id = ?`;
            await connection.query(updateQuery, updateValues);
        }

        return NextResponse.json({
            message: 'Farmer data updated successfully',
            uploadedFarmerDocs: newFarmerDocNames,
            uploadedSchemeDocs: newSchemeDocNames,
            uploadedAadhaarDocs: newAadhaarDocNames,
            uploadedProfileDocs: newProfileDocNames,
            geophotos1: geophotos,
        });

    } catch (error) {
        console.error('Error updating farmer:', error);
        return NextResponse.json({ message: 'Update failed' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}


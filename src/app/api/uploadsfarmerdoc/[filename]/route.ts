// app/api/uploads/[filename]/route.ts
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

type Params = {
  params: Promise<{ filename: string }>;
};

export async function GET(
  request: Request,
  { params }: Params
) {
  try {
    // Await the params promise first
    const resolvedParams = await params;

    // Security: Prevent directory traversal
    const safeFilename = path.basename(resolvedParams.filename);
    const filePath = path.join(
      process.cwd(), // Use project root as base
      'tmp',
      'uploads',
      'farmersdocument',
      safeFilename
    );

    // Read file from filesystem
    const fileBuffer = await readFile(filePath);

    // Determine content type
    const extension = path.extname(safeFilename).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[extension] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.log("fsadfadsf", error)
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}

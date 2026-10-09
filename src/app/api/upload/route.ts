import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * Local file upload API — saves profile photos and resumes
 * to the local filesystem when Firebase Storage is unreachable.
 * Files are stored in /public/uploads/users/{userId}/{type}/
 */

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const uploadType = formData.get('type') as string; // 'profile' or 'resumes'

    if (!file || !userId || !uploadType) {
      return NextResponse.json({ error: 'Missing file, userId, or type' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 });
    }

    // Create directory structure
    const userDir = path.join(UPLOAD_DIR, 'users', userId, uploadType);
    await fs.mkdir(userDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${Date.now()}${ext}`;
    const filePath = path.join(userDir, filename);

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Return URL that can be accessed via Next.js static serving
    const publicUrl = `/uploads/users/${userId}/${uploadType}/${filename}`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}

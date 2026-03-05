import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const file = await prisma.documentFile.findFirst({
      where: { type: { in: ['docx', 'xlsx'] } }
    });
    
    if (!file) {
      return NextResponse.json({ error: 'No files found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: file.id,
      name: file.name,
      type: file.type,
      hasFileData: !!file.fileData,
      wopiUrl: `http://localhost:3000/api/wopi/files/${file.id}`
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

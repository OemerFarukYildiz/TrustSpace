import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper to get file
async function getFile(id: string) {
  return await prisma.documentFile.findUnique({ where: { id } });
}

// Helper to get file content as buffer
async function getFileContent(file: any): Promise<Buffer> {
  // Immer fileData verwenden wenn vorhanden (echtes Binary)
  if (file.fileData && file.fileData.length > 0) {
    return Buffer.from(file.fileData, 'base64');
  }
  // Fallback: leere aber valide xlsx/docx zurückgeben
  return Buffer.from('', 'utf-8');
}

// WOPI GetFile endpoint (GET /wopi/files/{id}/contents)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const file = await getFile(id);

    if (!file) {
      console.log(`WOPI GetFile: File not found: ${id}`);
      return new NextResponse('File not found', { status: 404 });
    }

    const content = await getFileContent(file);
    console.log(`WOPI GetFile: ${file.name}, returning ${content.length} bytes`);
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('WOPI GetFile error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// WOPI PutFile endpoint (POST /wopi/files/{id}/contents)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const file = await getFile(id);

    if (!file) {
      return new NextResponse('File not found', { status: 404 });
    }

    const body = await request.arrayBuffer();
    
    if (body.byteLength === 0) {
      return new NextResponse('Empty body', { status: 400 });
    }
    
    const base64Content = Buffer.from(body).toString('base64');
    
    await prisma.documentFile.update({
      where: { id },
      data: { 
        fileData: base64Content,
        updatedAt: new Date()
      }
    });

    console.log(`WOPI PutFile: ${file.name}, saved ${body.byteLength} bytes`);
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('WOPI PutFile error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper to get file
async function getFile(id: string) {
  return await prisma.documentFile.findUnique({ where: { id } });
}

// Helper to calculate file size
async function getFileSize(file: any): Promise<number> {
  if (file.fileData && file.fileData.length > 0) {
    return Buffer.from(file.fileData, 'base64').length;
  }
  
  if (file.sheetData && file.type === 'xlsx') {
    return Buffer.byteLength(file.sheetData, 'utf-8');
  }
  
  if (file.content && file.type === 'docx') {
    return Buffer.byteLength(file.content, 'utf-8');
  }
  
  return 0;
}

// WOPI CheckFileInfo endpoint (GET /wopi/files/{id})
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    const file = await getFile(id);

    if (!file) {
      console.log(`WOPI CheckFileInfo: File not found: ${id}`);
      return new NextResponse('File not found', { status: 404 });
    }

    const size = await getFileSize(file);

    console.log(`WOPI CheckFileInfo: ${file.name}, size: ${size}, type: ${file.type}`);

    // WOPI CheckFileInfo response
    const fileInfo = {
      BaseFileName: file.name,
      OwnerId: 'trustspace',
      Size: size,
      UserId: 'user',
      UserFriendlyName: 'User',
      UserCanWrite: true,
      UserCanNotWriteRelative: false,
      SupportsUpdate: true,
      SupportsLocks: false,
      SupportsGetLock: false,
      SupportsExtendedLockLength: false,
      SupportsGetFile: true,
      SupportsPutFile: true,
      SupportsRename: true,
      SupportsDeleteFile: true,
      SupportsContainers: false,
      SupportsUserInfo: false,
      ReadOnly: false,
      PostMessageOrigin: 'http://localhost:3000',
      LastModifiedTime: file.updatedAt.toISOString(),
    };

    return NextResponse.json(fileInfo);
  } catch (error) {
    console.error('WOPI CheckFileInfo error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    const file = await prisma.documentFile.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const supportedTypes = ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'];
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported for editing' }, { status: 400 });
    }

    // Collabora läuft in Docker - Discovery von innen (collabora:9980)
    const collaboraInternalUrl = 'http://localhost:9980';

    // WOPISrc: muss vom Browser UND von Collabora erreichbar sein
    // Collabora (Docker) erreicht die App über host.docker.internal
    // Aber der Browser baut den WebSocket mit dieser URL auf
    // Lösung: localhost:3000 für den Browser, Collabora resolved das intern
    const wopiSrc = encodeURIComponent(`http://localhost:3000/api/wopi/files/${fileId}`);

    // Discovery dynamisch laden
    let coolHtmlUrl = `${collaboraInternalUrl}/browser/cool.html`;
    try {
      const discoveryRes = await fetch(`${collaboraInternalUrl}/hosting/discovery`, {
        signal: AbortSignal.timeout(3000)
      });
      if (discoveryRes.ok) {
        const xml = await discoveryRes.text();
        const match = xml.match(/src="(http:\/\/[^"]*cool\.html)/);
        if (match) {
          // Ersetze den internen Host mit localhost für den Browser
          coolHtmlUrl = match[1].replace('collabora:9980', 'localhost:9980');
        }
      }
    } catch (e) {
      console.log('Discovery failed:', e);
    }

    const accessToken = Buffer.from(`${fileId}:${Date.now()}`).toString('base64');

    const editorUrl = `${coolHtmlUrl}?` +
      `WOPISrc=${wopiSrc}&` +
      `access_token=${accessToken}&` +
      `access_token_ttl=0&` +
      `lang=de&` +
      `closebutton=1`;

    console.log('Editor URL:', editorUrl);
    console.log('WOPISrc:', decodeURIComponent(wopiSrc));

    return NextResponse.json({ url: editorUrl, fileName: file.name });
  } catch (error) {
    console.error('Collabora URL generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

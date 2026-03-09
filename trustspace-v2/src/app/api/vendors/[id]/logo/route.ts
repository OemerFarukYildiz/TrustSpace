import { NextRequest, NextResponse } from "next/server";

// POST /api/vendors/[id]/logo - Vendor-Logo von Clearbit abrufen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // consume params
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const logoUrl = `https://logo.clearbit.com/${cleanDomain}`;

    try {
      const response = await fetch(logoUrl);

      if (!response.ok) {
        return NextResponse.json({ logo: null });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      const contentType = response.headers.get("content-type") || "image/png";

      return NextResponse.json({
        logo: `data:${contentType};base64,${base64}`,
      });
    } catch {
      // Clearbit-Abruf fehlgeschlagen
      return NextResponse.json({ logo: null });
    }
  } catch (error) {
    console.error("Failed to fetch vendor logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor logo" },
      { status: 500 }
    );
  }
}

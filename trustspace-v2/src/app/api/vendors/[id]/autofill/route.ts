import { NextRequest, NextResponse } from "next/server";
import { llm } from "@/lib/llm/client";

// POST /api/vendors/[id]/autofill - Vendor-Informationen per LLM ausfuellen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // consume params (vendorId available if needed)
    const { vendorName } = await request.json();

    if (!vendorName) {
      return NextResponse.json(
        { error: "vendorName is required" },
        { status: 400 }
      );
    }

    const prompt = `You are a helpful assistant that provides structured information about companies/vendors.
Please provide the following information about the company "${vendorName}" in JSON format.
If you don't know a value, use null.

Return ONLY valid JSON with this exact structure:
{
  "website": "https://example.com",
  "address": "Full street address",
  "country": "Country name",
  "industry": "Industry sector",
  "certifications": ["ISO 27001", "SOC 2"],
  "gdprCompliant": true,
  "employeeCount": "1-50 | 51-200 | 201-1000 | 1001-5000 | 5000+"
}

Return ONLY the JSON object, no additional text.`;

    const response = await llm.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1024,
    });

    let vendorInfo;
    try {
      // Versuche JSON aus der Antwort zu parsen
      const content = response.content.trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        vendorInfo = JSON.parse(jsonMatch[0]);
      } else {
        vendorInfo = JSON.parse(content);
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse LLM response", raw: response.content },
        { status: 422 }
      );
    }

    return NextResponse.json({
      website: vendorInfo.website || null,
      address: vendorInfo.address || null,
      country: vendorInfo.country || null,
      industry: vendorInfo.industry || null,
      certifications: vendorInfo.certifications || [],
      gdprCompliant: vendorInfo.gdprCompliant ?? null,
      employeeCount: vendorInfo.employeeCount || null,
    });
  } catch (error) {
    console.error("Failed to autofill vendor info:", error);
    return NextResponse.json(
      { error: "Failed to autofill vendor info" },
      { status: 500 }
    );
  }
}

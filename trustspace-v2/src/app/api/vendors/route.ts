import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "default-org";

// GET /api/vendors - Liste aller Vendors
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: any = { organizationId: ORG_ID };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { services: { contains: search } },
        { contactName: { contains: search } },
        { contactEmail: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.assessmentStatus = status;
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            assessments: true,
            vendorDocuments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

// POST /api/vendors - Neuen Vendor erstellen
export async function POST(request: Request) {
  try {
    const data = await request.json();

    const vendor = await prisma.vendor.create({
      data: {
        organizationId: ORG_ID,
        name: data.name,
        category: data.category,
        services: data.services || null,
        trustCenterUrl: data.trustCenterUrl || null,
        certifications: data.certifications || null,
        dpoContact: data.dpoContact || null,
        gdprCompliant: data.gdprCompliant ?? null,
        assessmentStatus: data.assessmentStatus || "none",
        assessmentData: data.assessmentData || null,
        logoUrl: data.logoUrl || null,
        website: data.website || null,
        address: data.address || null,
        country: data.country || null,
        employeeCount: data.employeeCount || null,
        foundedYear: data.foundedYear ?? null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        dataProcessingAgreement: data.dataProcessingAgreement ?? false,
        subProcessors: data.subProcessors || null,
        riskLevel: data.riskLevel || null,
        lastReviewDate: data.lastReviewDate ? new Date(data.lastReviewDate) : null,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : null,
        description: data.description || null,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    console.error("Failed to create vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}

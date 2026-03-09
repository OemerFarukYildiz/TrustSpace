import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/vendors/[id] - Einzelnen Vendor mit Relations laden
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        assessments: {
          orderBy: { createdAt: "desc" },
        },
        vendorDocuments: {
          orderBy: { createdAt: "desc" },
        },
        vendorComments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Failed to fetch vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/[id] - Vendor aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        category: data.category ?? existing.category,
        services: data.services !== undefined ? data.services : existing.services,
        trustCenterUrl: data.trustCenterUrl !== undefined ? data.trustCenterUrl : existing.trustCenterUrl,
        certifications: data.certifications !== undefined ? data.certifications : existing.certifications,
        dpoContact: data.dpoContact !== undefined ? data.dpoContact : existing.dpoContact,
        gdprCompliant: data.gdprCompliant !== undefined ? data.gdprCompliant : existing.gdprCompliant,
        assessmentStatus: data.assessmentStatus !== undefined ? data.assessmentStatus : existing.assessmentStatus,
        assessmentData: data.assessmentData !== undefined ? data.assessmentData : existing.assessmentData,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : existing.logoUrl,
        website: data.website !== undefined ? data.website : existing.website,
        address: data.address !== undefined ? data.address : existing.address,
        country: data.country !== undefined ? data.country : existing.country,
        employeeCount: data.employeeCount !== undefined ? data.employeeCount : existing.employeeCount,
        foundedYear: data.foundedYear !== undefined ? data.foundedYear : existing.foundedYear,
        contactName: data.contactName !== undefined ? data.contactName : existing.contactName,
        contactEmail: data.contactEmail !== undefined ? data.contactEmail : existing.contactEmail,
        contactPhone: data.contactPhone !== undefined ? data.contactPhone : existing.contactPhone,
        dataProcessingAgreement: data.dataProcessingAgreement !== undefined ? data.dataProcessingAgreement : existing.dataProcessingAgreement,
        subProcessors: data.subProcessors !== undefined ? data.subProcessors : existing.subProcessors,
        riskLevel: data.riskLevel !== undefined ? data.riskLevel : existing.riskLevel,
        lastReviewDate: data.lastReviewDate !== undefined
          ? (data.lastReviewDate ? new Date(data.lastReviewDate) : null)
          : existing.lastReviewDate,
        nextReviewDate: data.nextReviewDate !== undefined
          ? (data.nextReviewDate ? new Date(data.nextReviewDate) : null)
          : existing.nextReviewDate,
        description: data.description !== undefined ? data.description : existing.description,
      },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Failed to update vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[id] - Vendor loeschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }

    await prisma.vendor.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}

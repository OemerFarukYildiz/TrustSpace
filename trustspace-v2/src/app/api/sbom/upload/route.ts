import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SBOMParser } from "@/lib/sbom-parser";
import { scanAndSyncFindings } from "@/lib/cve-findings-sync";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const assetId = formData.get("assetId") as string;
    const versionLabel = formData.get("versionLabel") as string || "1.0.0";

    if (!file || !assetId) {
      return NextResponse.json(
        { error: "File and assetId are required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".json")) {
      return NextResponse.json(
        { error: "Only JSON files are supported" },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Validate SBOM format
    const validation = SBOMParser.validateFormat(fileContent);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid SBOM format: ${validation.error}` },
        { status: 400 }
      );
    }

    // Parse SBOM
    const parsedSBOM = SBOMParser.parse(fileContent);

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { organization: true },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found" },
        { status: 404 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark previous SBOM as not latest
      await tx.sbomDocument.updateMany({
        where: {
          assetId: assetId,
          isLatest: true,
        },
        data: {
          isLatest: false,
        },
      });

      // Create new SBOM document
      const sbomDocument = await tx.sbomDocument.create({
        data: {
          organizationId: asset.organizationId,
          assetId: assetId,
          format: parsedSBOM.format,
          versionLabel,
          isLatest: true,
          serialNumber: parsedSBOM.serialNumber,
          rawJson: fileContent,
          uploadedBy: "system", // TODO: Get from auth context
        },
      });

      // Create components
      const componentPromises = parsedSBOM.components.map((comp) =>
        tx.sbomComponent.create({
          data: {
            sbomDocumentId: sbomDocument.id,
            purl: comp.purl,
            cpe: comp.cpe,
            name: comp.name,
            version: comp.version,
            supplier: comp.supplier,
            licenseSpdx: comp.licenseSpdx,
            hashSha256: comp.hashSha256,
            dependencyType: comp.dependencyType,
            completeness: parsedSBOM.completeness,
          },
        })
      );

      const components = await Promise.all(componentPromises);

      return {
        sbomDocument,
        components,
      };
    });

    // Trigger CVE scan + auto-create Findings after successful upload
    try {
      await scanAndSyncFindings(result.sbomDocument.id);
    } catch (error) {
      console.error("Failed to trigger immediate CVE scan:", error);
    }

    return NextResponse.json({
      success: true,
      sbomDocumentId: result.sbomDocument.id,
      componentsCount: result.components.length,
      format: parsedSBOM.format,
      versionLabel,
    });

  } catch (error) {
    console.error("SBOM upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload SBOM" },
      { status: 500 }
    );
  }
}


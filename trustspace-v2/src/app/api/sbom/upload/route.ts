import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SBOMParser } from "@/lib/sbom-parser";
import { OSVClient } from "@/lib/osv";

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

    // Trigger CVE scan after successful upload
    try {
      await triggerCVEScan(result.sbomDocument.id);
    } catch (error) {
      console.error("Failed to trigger immediate CVE scan:", error);
      // Don't fail the upload if scan fails
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

async function triggerCVEScan(sbomDocumentId: string) {
  try {
    // Get all components with PURLs
    const components = await prisma.sbomComponent.findMany({
      where: {
        sbomDocumentId,
        purl: {
          not: null,
        },
      },
    });

    if (components.length === 0) {
      console.log("No components with PURLs found for scanning");
      return;
    }

    const purls = components
      .map(c => c.purl)
      .filter((purl): purl is string => purl !== null && OSVClient.validatePurl(purl));

    if (purls.length === 0) {
      console.log("No valid PURLs found for scanning");
      return;
    }

    console.log(`Scanning ${purls.length} PURLs for vulnerabilities...`);
    console.log(`PURLs to scan:`, purls);

    // Scan for vulnerabilities
    const vulnerabilityResults = await OSVClient.batchScanPurls(purls);

    console.log(`Upload scan completed. Results:`, vulnerabilityResults);

    // Store vulnerability results
    const vulnerabilityPromises: Promise<any>[] = [];

    for (const [purl, vulnerabilities] of vulnerabilityResults) {
      const component = components.find(c => c.purl === purl);
      if (!component) continue;

      for (const vuln of vulnerabilities) {
        vulnerabilityPromises.push(
          prisma.vexVulnerability.upsert({
            where: {
              componentId_cveId: {
                componentId: component.id,
                cveId: vuln.cveId,
              },
            },
            update: {
              cvssScore: vuln.cvssScore,
              severity: vuln.severity,
              vexStatus: "under_investigation",
              remediation: vuln.details || vuln.summary,
              lastCheckedAt: new Date(),
            },
            create: {
              componentId: component.id,
              cveId: vuln.cveId,
              cvssScore: vuln.cvssScore,
              severity: vuln.severity,
              vexStatus: "under_investigation",
              remediation: vuln.details || vuln.summary,
              lastCheckedAt: new Date(),
            },
          })
        );
      }
    }

    await Promise.all(vulnerabilityPromises);

    console.log(`CVE scan completed. Found ${vulnerabilityPromises.length} vulnerabilities.`);

  } catch (error) {
    console.error("CVE scan failed:", error);
    throw error;
  }
}
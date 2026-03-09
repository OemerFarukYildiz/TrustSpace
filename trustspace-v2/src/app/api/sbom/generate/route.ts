import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SBOMParser } from "@/lib/sbom-parser";
import { scanAndSyncFindings } from "@/lib/cve-findings-sync";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(request: NextRequest) {
  try {
    const { assetId, versionLabel, projectPath } = await request.json();

    if (!assetId) {
      return NextResponse.json({ error: "assetId is required" }, { status: 400 });
    }

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { organization: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Use provided project path or fall back to current working directory
    const projectRoot = projectPath?.trim() || process.cwd();
    const outputFile = join(tmpdir(), `sbom-${Date.now()}.json`);

    try {
      execSync(
        `npx --yes @cyclonedx/cyclonedx-npm --output-format JSON --output-file "${outputFile}" --spec-version 1.6 --ignore-npm-errors`,
        {
          cwd: projectRoot,
          timeout: 120_000,
          stdio: "pipe",
        }
      );
    } catch (err: any) {
      // cyclonedx-npm exits non-zero on warnings but still writes the file
      if (!existsSync(outputFile)) {
        console.error("SBOM generation failed:", err.stderr?.toString());
        return NextResponse.json(
          { error: "SBOM generation failed", details: err.stderr?.toString() },
          { status: 500 }
        );
      }
    }

    const { readFileSync } = await import("fs");
    const fileContent = readFileSync(outputFile, "utf-8");

    // Clean up temp file
    try { unlinkSync(outputFile); } catch {}

    // Validate & parse
    const validation = SBOMParser.validateFormat(fileContent);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Invalid SBOM format: ${validation.error}` },
        { status: 400 }
      );
    }

    const parsedSBOM = SBOMParser.parse(fileContent);
    const label = versionLabel || "auto-generated";

    const result = await prisma.$transaction(async (tx) => {
      // Mark previous SBOMs as not latest
      await tx.sbomDocument.updateMany({
        where: { assetId, isLatest: true },
        data: { isLatest: false },
      });

      // Create SBOM document
      const sbomDocument = await tx.sbomDocument.create({
        data: {
          organizationId: asset.organizationId,
          assetId,
          format: parsedSBOM.format,
          versionLabel: label,
          isLatest: true,
          serialNumber: parsedSBOM.serialNumber,
          rawJson: fileContent,
          uploadedBy: "auto-generated",
        },
      });

      // Create components
      const components = await Promise.all(
        parsedSBOM.components.map((comp) =>
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
        )
      );

      return { sbomDocument, components };
    });

    // Trigger CVE scan + auto-create Findings
    try {
      await scanAndSyncFindings(result.sbomDocument.id);
    } catch (err) {
      console.error("CVE scan after generation failed:", err);
    }

    return NextResponse.json({
      success: true,
      sbomDocumentId: result.sbomDocument.id,
      componentsCount: result.components.length,
      format: parsedSBOM.format,
      versionLabel: label,
    });
  } catch (error: any) {
    console.error("SBOM generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate SBOM", details: error.message },
      { status: 500 }
    );
  }
}


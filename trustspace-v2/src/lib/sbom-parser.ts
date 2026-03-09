import { z } from "zod";

// CycloneDX Schema Validation
const CycloneDXComponent = z.object({
  type: z.string().optional(),
  "bom-ref": z.string().optional(),
  supplier: z.object({
    name: z.string().optional(),
  }).optional(),
  name: z.string(),
  version: z.string().optional(),
  purl: z.string().optional(),
  cpe: z.string().optional(),
  licenses: z.array(z.object({
    license: z.object({
      id: z.string().optional(),
      name: z.string().optional(),
    }).optional(),
  })).optional(),
  hashes: z.array(z.object({
    alg: z.string(),
    content: z.string(),
  })).optional(),
});

const CycloneDXSchema = z.object({
  bomFormat: z.literal("CycloneDX"),
  specVersion: z.string(),
  serialNumber: z.string().optional(),
  version: z.number().optional(),
  metadata: z.object({
    component: CycloneDXComponent.optional(),
  }).optional(),
  components: z.array(CycloneDXComponent).optional(),
  dependencies: z.array(z.object({
    ref: z.string(),
    dependsOn: z.array(z.string()).optional(),
  })).optional(),
});

// SPDX Schema Validation
const SPDXPackage = z.object({
  SPDXID: z.string(),
  name: z.string(),
  versionInfo: z.string().optional(),
  supplier: z.string().optional(),
  licenseConcluded: z.string().optional(),
  licenseDeclared: z.string().optional(),
  checksums: z.array(z.object({
    algorithm: z.string(),
    checksumValue: z.string(),
  })).optional(),
  externalRefs: z.array(z.object({
    referenceCategory: z.string(),
    referenceType: z.string(),
    referenceLocator: z.string(),
  })).optional(),
});

const SPDXSchema = z.object({
  spdxVersion: z.string(),
  dataLicense: z.string(),
  SPDXID: z.string(),
  name: z.string(),
  documentNamespace: z.string(),
  packages: z.array(SPDXPackage).optional(),
  relationships: z.array(z.object({
    spdxElementId: z.string(),
    relationshipType: z.string(),
    relatedSpdxElement: z.string(),
  })).optional(),
});

export interface ParsedComponent {
  name: string;
  version?: string;
  purl?: string;
  cpe?: string;
  supplier?: string;
  licenseSpdx?: string;
  hashSha256?: string;
  dependencyType: "direct" | "transitive" | "unknown";
  bomRef?: string;
}

export interface ParsedSBOM {
  format: "cyclonedx" | "spdx";
  version: string;
  serialNumber?: string;
  components: ParsedComponent[];
  dependencies: Map<string, string[]>; // bomRef -> dependencies
  completeness: "complete" | "incomplete" | "no-assertion";
}

export class SBOMParser {
  static parse(jsonContent: string): ParsedSBOM {
    let parsedJson: any;

    try {
      parsedJson = JSON.parse(jsonContent);
    } catch (error) {
      throw new Error("Invalid JSON format");
    }

    // Detect format
    if (parsedJson.bomFormat === "CycloneDX") {
      return this.parseCycloneDX(parsedJson, jsonContent);
    } else if (parsedJson.spdxVersion) {
      return this.parseSPDX(parsedJson, jsonContent);
    } else {
      throw new Error("Unsupported SBOM format. Only CycloneDX and SPDX are supported.");
    }
  }

  private static parseCycloneDX(data: any, rawJson: string): ParsedSBOM {
    // Validate schema
    const validationResult = CycloneDXSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid CycloneDX format: ${validationResult.error.message}`);
    }

    const sbom = validationResult.data;
    const components: ParsedComponent[] = [];
    const dependenciesMap = new Map<string, string[]>();

    // Parse dependencies
    if (sbom.dependencies) {
      sbom.dependencies.forEach((dep) => {
        dependenciesMap.set(dep.ref, dep.dependsOn || []);
      });
    }

    // Parse main component (metadata)
    if (sbom.metadata?.component) {
      components.push(this.convertCycloneDXComponent(sbom.metadata.component, dependenciesMap, true));
    }

    // Parse all components
    if (sbom.components) {
      sbom.components.forEach((comp) => {
        components.push(this.convertCycloneDXComponent(comp, dependenciesMap));
      });
    }

    // Determine completeness
    const totalComponents = components.length;
    const componentsWithDeps = Array.from(dependenciesMap.keys()).length;
    const completeness: ParsedSBOM["completeness"] =
      componentsWithDeps === totalComponents ? "complete" :
      componentsWithDeps > 0 ? "incomplete" : "no-assertion";

    return {
      format: "cyclonedx",
      version: sbom.specVersion,
      serialNumber: sbom.serialNumber,
      components,
      dependencies: dependenciesMap,
      completeness,
    };
  }

  private static convertCycloneDXComponent(
    comp: z.infer<typeof CycloneDXComponent>,
    depsMap: Map<string, string[]>,
    isMainComponent = false
  ): ParsedComponent {
    const bomRef = comp["bom-ref"] || comp.name;
    const dependencies = depsMap.get(bomRef) || [];

    // Determine dependency type
    let dependencyType: "direct" | "transitive" | "unknown" = "unknown";
    if (isMainComponent) {
      dependencyType = "direct";
    } else if (dependencies.length === 0) {
      dependencyType = "direct";
    } else {
      dependencyType = "transitive";
    }

    // Extract license
    let licenseSpdx: string | undefined;
    if (comp.licenses && comp.licenses.length > 0) {
      const license = comp.licenses[0].license;
      licenseSpdx = license?.id || license?.name;
    }

    // Extract SHA256 hash
    let hashSha256: string | undefined;
    if (comp.hashes) {
      const sha256Hash = comp.hashes.find(h => h.alg === "SHA-256");
      hashSha256 = sha256Hash?.content;
    }

    return {
      name: comp.name,
      version: comp.version,
      purl: comp.purl,
      cpe: comp.cpe,
      supplier: comp.supplier?.name,
      licenseSpdx,
      hashSha256,
      dependencyType,
      bomRef,
    };
  }

  private static parseSPDX(data: any, rawJson: string): ParsedSBOM {
    // Validate schema
    const validationResult = SPDXSchema.safeParse(data);
    if (!validationResult.success) {
      throw new Error(`Invalid SPDX format: ${validationResult.error.message}`);
    }

    const sbom = validationResult.data;
    const components: ParsedComponent[] = [];
    const dependenciesMap = new Map<string, string[]>();

    // Parse relationships for dependencies
    if (sbom.relationships) {
      sbom.relationships.forEach((rel) => {
        if (rel.relationshipType === "DEPENDS_ON") {
          const existing = dependenciesMap.get(rel.spdxElementId) || [];
          existing.push(rel.relatedSpdxElement);
          dependenciesMap.set(rel.spdxElementId, existing);
        }
      });
    }

    // Parse packages
    if (sbom.packages) {
      sbom.packages.forEach((pkg) => {
        components.push(this.convertSPDXPackage(pkg, dependenciesMap));
      });
    }

    // Determine completeness
    const totalComponents = components.length;
    const componentsWithDeps = Array.from(dependenciesMap.keys()).length;
    const completeness: ParsedSBOM["completeness"] =
      componentsWithDeps === totalComponents ? "complete" :
      componentsWithDeps > 0 ? "incomplete" : "no-assertion";

    return {
      format: "spdx",
      version: sbom.spdxVersion,
      components,
      dependencies: dependenciesMap,
      completeness,
    };
  }

  private static convertSPDXPackage(
    pkg: z.infer<typeof SPDXPackage>,
    depsMap: Map<string, string[]>
  ): ParsedComponent {
    const dependencies = depsMap.get(pkg.SPDXID) || [];

    // Determine dependency type
    let dependencyType: "direct" | "transitive" | "unknown" = "unknown";
    if (dependencies.length === 0) {
      dependencyType = "direct";
    } else {
      dependencyType = "transitive";
    }

    // Extract PURL from external references
    let purl: string | undefined;
    if (pkg.externalRefs) {
      const purlRef = pkg.externalRefs.find(ref =>
        ref.referenceCategory === "PACKAGE-MANAGER" &&
        ref.referenceType === "purl"
      );
      purl = purlRef?.referenceLocator;
    }

    // Extract license
    let licenseSpdx = pkg.licenseConcluded || pkg.licenseDeclared;
    if (licenseSpdx === "NOASSERTION" || licenseSpdx === "NONE") {
      licenseSpdx = undefined;
    }

    // Extract SHA256 hash
    let hashSha256: string | undefined;
    if (pkg.checksums) {
      const sha256Hash = pkg.checksums.find(c => c.algorithm === "SHA256");
      hashSha256 = sha256Hash?.checksumValue;
    }

    return {
      name: pkg.name,
      version: pkg.versionInfo,
      purl,
      supplier: pkg.supplier,
      licenseSpdx,
      hashSha256,
      dependencyType,
      bomRef: pkg.SPDXID,
    };
  }

  static validateFormat(jsonContent: string): { isValid: boolean; format?: "cyclonedx" | "spdx"; error?: string } {
    try {
      const parsedJson = JSON.parse(jsonContent);

      if (parsedJson.bomFormat === "CycloneDX") {
        const result = CycloneDXSchema.safeParse(parsedJson);
        return {
          isValid: result.success,
          format: "cyclonedx",
          error: result.success ? undefined : result.error.message,
        };
      } else if (parsedJson.spdxVersion) {
        const result = SPDXSchema.safeParse(parsedJson);
        return {
          isValid: result.success,
          format: "spdx",
          error: result.success ? undefined : result.error.message,
        };
      } else {
        return {
          isValid: false,
          error: "Unsupported SBOM format. Only CycloneDX and SPDX are supported.",
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: "Invalid JSON format",
      };
    }
  }
}
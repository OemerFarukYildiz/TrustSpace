import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/sbom - Alle SBOM Einträge
export async function GET() {
  try {
    // In einer echten Implementierung würden hier SBOM-Daten aus einer Tabelle kommen
    // Für jetzt simulieren wir Daten basierend auf Software-Assets
    const softwareAssets = await prisma.asset.findMany({
      where: { category: "software" },
      include: {
        riskThreats: {
          include: {
            threat: true,
          },
        },
      },
    });

    const entries: any[] = [];

    for (const software of softwareAssets) {
      // Simulierte Komponenten pro Software
      const components = generateComponents(software.name);

      for (const component of components) {
        // Zähle Vulnerabilities basierend auf RiskThreats
        const vulnCount = software.riskThreats.filter(
          (rt) => rt.bruttoScore >= 15
        ).length;

        entries.push({
          id: `${software.id}-${component.name}`,
          softwareId: software.id,
          softwareName: software.name,
          componentName: component.name,
          componentVersion: component.version,
          componentType: component.type,
          license: component.license,
          vulnerabilityCount: vulnCount,
          criticalVulns: vulnCount > 2 ? Math.floor(vulnCount / 2) : 0,
          highVulns: vulnCount > 0 && vulnCount <= 2 ? vulnCount : vulnCount > 2 ? 1 : 0,
          mediumVulns: Math.floor(Math.random() * 3),
          lowVulns: Math.floor(Math.random() * 5),
          lastScanned: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch SBOM:", error);
    return NextResponse.json({ error: "Failed to fetch SBOM" }, { status: 500 });
  }
}

// Hilfsfunktion zum Generieren von Komponenten
function generateComponents(softwareName: string) {
  const components = [];

  // Je nach Software-Typ unterschiedliche Komponenten
  if (softwareName.toLowerCase().includes("web") || softwareName.toLowerCase().includes("app")) {
    components.push(
      { name: "React", version: "18.2.0", type: "framework", license: "MIT" },
      { name: "Node.js", version: "20.0.0", type: "runtime", license: "MIT" },
      { name: "Express", version: "4.18.0", type: "library", license: "MIT" },
    );
  } else if (softwareName.toLowerCase().includes("database") || softwareName.toLowerCase().includes("db")) {
    components.push(
      { name: "PostgreSQL", version: "15.0", type: "operating_system", license: "PostgreSQL" },
      { name: "Redis", version: "7.0", type: "library", license: "BSD" },
    );
  } else {
    components.push(
      { name: "Spring Boot", version: "3.0.0", type: "framework", license: "Apache-2.0" },
      { name: "Log4j", version: "2.20.0", type: "library", license: "Apache-2.0" },
    );
  }

  return components;
}

// POST /api/sbom - Neue SBOM Einträge erstellen
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Hier würde man SBOM-Daten in die Datenbank speichern
    // Für jetzt returnen wir einfach die Daten zurück

    return NextResponse.json({
      success: true,
      message: "SBOM entry created",
      data,
    });
  } catch (error: any) {
    console.error("Failed to create SBOM entry:", error);
    return NextResponse.json(
      { error: "Failed to create SBOM entry", details: error.message },
      { status: 500 }
    );
  }
}

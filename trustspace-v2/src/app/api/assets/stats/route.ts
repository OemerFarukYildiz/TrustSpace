import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/assets/stats - Statistiken für alle Kategorien
export async function GET() {
  try {
    // Alle Assets holen mit ihren Berechnungen
    const assets = await prisma.asset.findMany({
      select: {
        category: true,
        ciaAverage: true,
        _count: {
          select: {
            riskThreats: true,
          },
        },
      },
    });

    // Kategorie-Mapping
    const categoryMapping: Record<string, string> = {
      process: "processes",
      software: "software",
      hardware: "hardware",
      location: "locations",
      supplier: "suppliers",
    };

    const stats: Record<string, { 
      risksPercent: number; 
      assetsPercent: number; 
      assetCount: number;
      calculatedCount: number;
      withRisksCount: number;
    }> = {
      processes: { risksPercent: 0, assetsPercent: 0, assetCount: 0, calculatedCount: 0, withRisksCount: 0 },
      software: { risksPercent: 0, assetsPercent: 0, assetCount: 0, calculatedCount: 0, withRisksCount: 0 },
      hardware: { risksPercent: 0, assetsPercent: 0, assetCount: 0, calculatedCount: 0, withRisksCount: 0 },
      locations: { risksPercent: 0, assetsPercent: 0, assetCount: 0, calculatedCount: 0, withRisksCount: 0 },
      suppliers: { risksPercent: 0, assetsPercent: 0, assetCount: 0, calculatedCount: 0, withRisksCount: 0 },
    };

    // Zähle Assets pro Kategorie
    for (const asset of assets) {
      const mappedCategory = categoryMapping[asset.category] || asset.category;
      if (stats[mappedCategory]) {
        stats[mappedCategory].assetCount++;
        
        // Assets mit CIA berechnet (ciaAverage > 0)
        if (asset.ciaAverage > 0) {
          stats[mappedCategory].calculatedCount++;
        }
        
        // Assets mit Risiken (Threat Scenarios)
        if (asset._count.riskThreats > 0) {
          stats[mappedCategory].withRisksCount++;
        }
      }
    }

    // Berechne Prozentsätze
    for (const key of Object.keys(stats)) {
      const cat = stats[key];
      if (cat.assetCount > 0) {
        // assetsPercent = Anteil der Assets mit CIA-Berechnung
        cat.assetsPercent = Math.round((cat.calculatedCount / cat.assetCount) * 100);
        // risksPercent = Anteil der Assets mit Risiken
        cat.risksPercent = Math.round((cat.withRisksCount / cat.assetCount) * 100);
      }
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}

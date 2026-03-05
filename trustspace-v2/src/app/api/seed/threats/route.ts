import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Standard ISO 27005 Threat Scenarios mit B-Codes
const standardThreats = [
  { code: "B001", name: "Violation of laws / regulations", description: "Violation of laws, regulations, data protection regulations, corporate guidelines / standards", category: "Legal" },
  { code: "B006", name: "Failure of service provider", description: "Failure or malfunction of service provider", category: "Operational" },
  { code: "B007", name: "Inadequate contractual arrangements", description: "Inadequate contractual arrangements", category: "Legal" },
  { code: "B008", name: "Incorrect use of equipment", description: "Incorrect use or administration of equipment and systems", category: "Operational" },
  { code: "B009", name: "Configuration errors", description: "Configuration errors", category: "Technical" },
  { code: "B010", name: "Insufficient personnel availability", description: "Insufficient availability of personnel", category: "Operational" },
  { code: "B011", name: "Fire", description: "Fire damage", category: "Physical" },
  { code: "B012", name: "Water damage", description: "Water damage (flooding, pipe burst)", category: "Physical" },
  { code: "B013", name: "Negative site factors", description: "Negative site factors (environment, major events, etc.)", category: "Physical" },
  { code: "B014", name: "Utility failure", description: "Utility failure (power, water, etc.)", category: "Technical" },
  { code: "B015", name: "Communications network failure", description: "Failure or disruption of communications networks", category: "Technical" },
  { code: "B016", name: "Sabotage, vandalism", description: "Sabotage, vandalism (equipment and data carriers)", category: "Physical" },
  { code: "B017", name: "Malicious programs", description: "Malicious programs (malware, viruses, ransomware)", category: "Technical" },
  { code: "B018", name: "Theft / loss", description: "Theft or loss of devices, data carriers or documents", category: "Physical" },
  { code: "B019", name: "Unauthorized information recovery", description: "Unauthorized recovery of information", category: "Operational" },
  { code: "B020", name: "Data from dubious sources", description: "Data from dubious sources", category: "Operational" },
  { code: "B021", name: "Manipulation", description: "Manipulation of hardware, software, or information", category: "Technical" },
  { code: "B022", name: "Hardware and software errors", description: "Hardware and software errors", category: "Technical" },
  { code: "B024", name: "Unauthorized use", description: "Unauthorized use of equipment or applications", category: "Operational" },
  { code: "B025", name: "Copyright violation", description: "Violation of copyrights and licenses", category: "Legal" },
  { code: "B026", name: "Breach of contract", description: "Breach of contract", category: "Legal" },
  { code: "B027", name: "Unauthorized entry", description: "Unauthorized entry into premises", category: "Physical" },
  { code: "B029", name: "Espionage, eavesdropping", description: "Espionage, eavesdropping", category: "Operational" },
  { code: "B030", name: "Coercion, extortion, corruption", description: "Coercion, extortion, corruption", category: "Operational" },
];

// POST /api/seed/threats - Seed standard threat scenarios
export async function POST() {
  try {
    // Prüfe ob bereits Threats existieren
    const existingCount = await prisma.threatScenario.count();
    
    if (existingCount > 0) {
      // Lösche alte und erstelle neue
      await prisma.threatScenario.deleteMany({});
    }

    const created = [];

    for (const threat of standardThreats) {
      const newThreat = await prisma.threatScenario.create({
        data: {
          code: threat.code,
          name: threat.name,
          description: threat.description,
          category: threat.category,
          organizationId: "default",
        },
      });
      created.push(newThreat);
    }

    return NextResponse.json({
      message: `Seeded ${created.length} threat scenarios`,
      created: created.map((t) => ({ code: t.code, name: t.name })),
    });
  } catch (error) {
    console.error("Failed to seed threats:", error);
    return NextResponse.json({ error: "Failed to seed threats" }, { status: 500 });
  }
}

// GET /api/seed/threats - Check if threats exist
export async function GET() {
  try {
    const count = await prisma.threatScenario.count();
    const threats = await prisma.threatScenario.findMany({
      select: { code: true, name: true },
      orderBy: { code: "asc" },
    });
    return NextResponse.json({ count, seeded: count > 0, threats });
  } catch (error) {
    console.error("Failed to check threats:", error);
    return NextResponse.json({ error: "Failed to check threats" }, { status: 500 });
  }
}

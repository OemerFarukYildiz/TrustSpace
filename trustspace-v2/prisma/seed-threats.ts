import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const threatScenarios = [
  { code: "B001", name: "Force majeure (höhere Gewalt)", category: "G" },
  { code: "B002", name: "Water damage", category: "G" },
  { code: "B003", name: "Fire", category: "G" },
  { code: "B004", name: "Inadequate emergency management", category: "H" },
  { code: "B005", name: "Insufficient resources", category: "H" },
  { code: "B006", name: "Failure of service provider", category: "H" },
  { code: "B007", name: "Equipment failure", category: "H" },
  { code: "B008", name: "Software errors", category: "H" },
  { code: "B009", name: "Configuration errors", category: "H" },
  { code: "B010", name: "Unauthorized access to IT systems", category: "I" },
  { code: "B011", name: "Malware", category: "I" },
  { code: "B012", name: "Social engineering", category: "I" },
  { code: "B013", name: "Data loss", category: "I" },
  { code: "B014", name: "Insufficient backup", category: "I" },
  { code: "B015", name: "Non-compliance with regulations", category: "O" },
  { code: "B016", name: "Staff shortage", category: "O" },
  { code: "B017", name: "Insider attack", category: "O" },
  { code: "B018", name: "Theft", category: "O" },
  { code: "B019", name: "Eavesdropping", category: "O" },
  { code: "B020", name: "Unauthorised entry", category: "O" },
];

async function main() {
  console.log('Creating default organization...');
  
  // Erstelle default Organization falls nicht vorhanden
  await prisma.organization.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'TrustSpace Default',
    },
  });

  console.log('Seeding threat scenarios...');

  for (const threat of threatScenarios) {
    await prisma.threatScenario.upsert({
      where: {
        organizationId_code: {
          organizationId: 'default',
          code: threat.code,
        },
      },
      update: {},
      create: {
        code: threat.code,
        name: threat.name,
        category: threat.category,
        organizationId: 'default',
      },
    });
  }

  console.log('Seeded', threatScenarios.length, 'threat scenarios');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

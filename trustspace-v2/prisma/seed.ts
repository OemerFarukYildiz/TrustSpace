import { prisma } from '../src/lib/db';

async function main() {
  console.log('🌱 Seeding database...');

  // Create organization
  const org = await prisma.organization.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'TrustSpace GmbH',
      description: 'Demo Organisation für ISMS',
      industry: 'IT & Software',
    },
  });

  // Create employees
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { id: 'emp-1' },
      update: {},
      create: {
        id: 'emp-1',
        organizationId: org.id,
        email: 'admin@trustspace.local',
        firstName: 'Admin',
        lastName: 'User',
        role: 'Admin',
        department: 'IT',
      },
    }),
    prisma.employee.upsert({
      where: { id: 'emp-2' },
      update: {},
      create: {
        id: 'emp-2',
        organizationId: org.id,
        email: 'isb@trustspace.local',
        firstName: 'ISB',
        lastName: 'Manager',
        role: 'ISB',
        department: 'Security',
      },
    }),
  ]);

  // Create ISO 27001:2022 Controls (SOA)
  const controls = [
    { code: 'A.5.1', title: 'Informationssicherheitsrichtlinien', category: 'A.5' },
    { code: 'A.5.2', title: 'Informationssicherheitsrollen und -verantwortlichkeiten', category: 'A.5' },
    { code: 'A.5.3', title: 'Trennung von Aufgaben, Verantwortlichkeiten und Befugnissen', category: 'A.5' },
    { code: 'A.5.4', title: 'Managementverantwortung', category: 'A.5' },
    { code: 'A.5.5', title: 'Kontaktdaten zu spezialisierten Informationssicherheitsfunktionen', category: 'A.5' },
    { code: 'A.5.6', title: 'Kontaktdaten zu relevanten Interessenvertretern', category: 'A.5' },
    { code: 'A.5.7', title: 'Informationssicherheit in der Projektmanagement', category: 'A.5' },
    { code: 'A.5.8', title: 'Informationssicherheit in der Projektmanagement', category: 'A.5' },
    { code: 'A.6.1', title: 'Screening', category: 'A.6' },
    { code: 'A.6.2', title: 'Bedingungen der Anstellung', category: 'A.6' },
    { code: 'A.6.3', title: 'Verpflichtung zur Informationssicherheit', category: 'A.6' },
    { code: 'A.6.4', title: 'Belehrungsverfahren', category: 'A.6' },
    { code: 'A.6.5', title: 'Disziplinarverfahren', category: 'A.6' },
    { code: 'A.6.6', title: 'Verantwortlichkeiten nach Beendigung oder Änderung der Anstellung', category: 'A.6' },
    { code: 'A.6.7', title: 'Geheimhaltungsvereinbarungen', category: 'A.6' },
    { code: 'A.6.8', title: 'Bericht über Informationssicherheitsvorfälle', category: 'A.6' },
    { code: 'A.7.1', title: 'Physische Sicherheitsperimeter', category: 'A.7' },
    { code: 'A.7.2', title: 'Physische Zugangskontrolle', category: 'A.7' },
    { code: 'A.7.3', title: 'Absichern von Büros, Räumen und Einrichtungen', category: 'A.7' },
    { code: 'A.7.4', title: 'Physische Sicherheit gegen Naturereignisse und Angriffe', category: 'A.7' },
    { code: 'A.7.5', title: 'Arbeitsplatz sichern', category: 'A.7' },
    { code: 'A.7.6', title: 'Zugangskontrolle und Berechtigungen', category: 'A.7' },
    { code: 'A.7.7', title: 'Schutz gegen Bedrohungen', category: 'A.7' },
    { code: 'A.8.1', title: 'Benutzerendgeräte', category: 'A.8' },
    { code: 'A.8.2', title: 'Berechtigungen für den Zugriff auf Informationen', category: 'A.8' },
    { code: 'A.8.3', title: 'Zugriffsrechte', category: 'A.8' },
    { code: 'A.8.4', title: 'Quellcode-Zugriffsbeschränkungen', category: 'A.8' },
    { code: 'A.8.5', title: 'Sichere Authentisierungsinformationen', category: 'A.8' },
    { code: 'A.8.6', title: 'Fähigkeiten zur Authentisierung', category: 'A.8' },
    { code: 'A.8.7', title: 'Schutz vor Malware', category: 'A.8' },
    { code: 'A.8.8', title: 'Management technischer Sicherheitslücken', category: 'A.8' },
    { code: 'A.8.9', title: 'Konfigurationsmanagement', category: 'A.8' },
    { code: 'A.8.10', title: 'Löschung von Informationen', category: 'A.8' },
    { code: 'A.8.11', title: 'Datenmaskierung', category: 'A.8' },
    { code: 'A.8.12', title: 'Verhinderung von Datenlecks', category: 'A.8' },
    { code: 'A.8.13', title: 'Sicherung von Informationen bei der Übertragung', category: 'A.8' },
    { code: 'A.8.14', title: 'Vertraulichkeits- oder Nichtoffenbarungsvereinbarungen', category: 'A.8' },
    { code: 'A.8.15', title: 'Informationssicherheitsübertragung', category: 'A.8' },
    { code: 'A.8.16', title: 'Aktivitätsprotokollierung', category: 'A.8' },
    { code: 'A.8.17', title: 'Protokollschutz', category: 'A.8' },
    { code: 'A.8.18', title: 'Protokollierung von Ereignissen', category: 'A.8' },
    { code: 'A.8.19', title: 'Zeitsynchronisation', category: 'A.8' },
    { code: 'A.8.20', title: 'Sichere Installation und Konfiguration von Systemen', category: 'A.8' },
    { code: 'A.8.21', title: 'Netzwerksicherheitskontrollen', category: 'A.8' },
    { code: 'A.8.22', title: 'Sicherheit von Netzwerkdiensten', category: 'A.8' },
    { code: 'A.8.23', title: 'Trennung in Netzwerken', category: 'A.8' },
    { code: 'A.8.24', title: 'Nutzungsregelungen für Webdienste', category: 'A.8' },
    { code: 'A.8.25', title: 'Sichere Protokollierung und Überwachung', category: 'A.8' },
    { code: 'A.8.26', title: 'Sicherheit von Anwendungsdiensten', category: 'A.8' },
    { code: 'A.8.27', title: 'Sichere Systemarchitektur und Systementwicklung', category: 'A.8' },
    { code: 'A.8.28', title: 'Sichere Codierung', category: 'A.8' },
    { code: 'A.8.29', title: 'Sicherheitstests in der Entwicklung und Akzeptanz', category: 'A.8' },
    { code: 'A.8.30', title: 'Outsourced Development', category: 'A.8' },
    { code: 'A.8.31', title: 'Entwicklungs-, Test- und Produktivumgebungen trennen', category: 'A.8' },
    { code: 'A.8.32', title: 'Change Management', category: 'A.8' },
    { code: 'A.8.33', title: 'Testinformationen', category: 'A.8' },
    { code: 'A.8.34', title: 'Schutz von Informationssystemen bei Wartungsarbeiten', category: 'A.8' },
  ];

  for (const control of controls) {
    await prisma.control.upsert({
      where: { id: `control-${control.code}` },
      update: {},
      create: {
        id: `control-${control.code}`,
        organizationId: org.id,
        code: control.code,
        title: control.title,
        isApplicable: true,
        description: `ISO 27001:2022 Control ${control.code}`,
      },
    });
  }

  // Create sample assets
  const assets = [
    { name: 'Kundendaten', type: 'primary', category: 'information', confidentiality: 4, integrity: 5, availability: 3 },
    { name: 'Finanzdaten', type: 'primary', category: 'information', confidentiality: 5, integrity: 5, availability: 3 },
    { name: 'Quellcode', type: 'primary', category: 'information', confidentiality: 5, integrity: 4, availability: 3 },
    { name: 'Produktions-Server', type: 'secondary', category: 'hardware', confidentiality: 3, integrity: 4, availability: 5 },
    { name: 'Entwicklungsrechner', type: 'secondary', category: 'hardware', confidentiality: 3, integrity: 3, availability: 3 },
    { name: 'CRM-System', type: 'secondary', category: 'software', confidentiality: 4, integrity: 4, availability: 4 },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: `asset-${asset.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `asset-${asset.name.toLowerCase().replace(/\s+/g, '-')}`,
        organizationId: org.id,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        confidentiality: asset.confidentiality,
        integrity: asset.integrity,
        availability: asset.availability,
        ownerId: employees[0].id,
      },
    });
  }

  // Create sample risks
  const risks = [
    { title: 'Datenverlust durch Hardwaredefekt', bruttoProbability: 3, bruttoImpact: 4, nettoProbability: 1, nettoImpact: 4 },
    { title: 'Unberechtigter Zugriff durch Mitarbeiter', bruttoProbability: 3, bruttoImpact: 4, nettoProbability: 2, nettoImpact: 3 },
    { title: 'Ransomware-Angriff', bruttoProbability: 2, bruttoImpact: 5, nettoProbability: 1, nettoImpact: 5 },
    { title: 'Phishing-Angriff auf Mitarbeiter', bruttoProbability: 4, bruttoImpact: 3, nettoProbability: 2, nettoImpact: 2 },
  ];

  for (const risk of risks) {
    await prisma.risk.upsert({
      where: { id: `risk-${risk.title.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}` },
      update: {},
      create: {
        id: `risk-${risk.title.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`,
        organizationId: org.id,
        title: risk.title,
        bruttoProbability: risk.bruttoProbability,
        bruttoImpact: risk.bruttoImpact,
        bruttoScore: risk.bruttoProbability * risk.bruttoImpact,
        nettoProbability: risk.nettoProbability,
        nettoImpact: risk.nettoImpact,
        nettoScore: risk.nettoProbability * risk.nettoImpact,
      },
    });
  }

  // Create sample vendors
  const vendors = [
    { name: 'Microsoft', category: 'Cloud Services', services: 'Microsoft 365, Azure', gdprCompliant: true },
    { name: 'AWS', category: 'Cloud Infrastructure', services: 'EC2, S3, RDS', gdprCompliant: true },
    { name: 'Salesforce', category: 'CRM', services: 'CRM Platform', gdprCompliant: true },
  ];

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { id: `vendor-${vendor.name.toLowerCase()}` },
      update: {},
      create: {
        id: `vendor-${vendor.name.toLowerCase()}`,
        organizationId: org.id,
        name: vendor.name,
        category: vendor.category,
        services: vendor.services,
        gdprCompliant: vendor.gdprCompliant,
      },
    });
  }

  // Create sample findings
  const findings = [
    { title: 'Fehlende 2FA für Admin-Accounts', type: 'improvement', priority: 'high', status: 'open' },
    { title: 'Backup-Strategie dokumentieren', type: 'improvement', priority: 'medium', status: 'in_progress' },
    { title: 'Schulung Datenschutz überfällig', type: 'task', priority: 'medium', status: 'open' },
  ];

  for (const finding of findings) {
    await prisma.finding.upsert({
      where: { id: `finding-${finding.title.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}` },
      update: {},
      create: {
        id: `finding-${finding.title.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`,
        organizationId: org.id,
        title: finding.title,
        type: finding.type,
        priority: finding.priority,
        status: finding.status,
        assigneeId: employees[1].id,
      },
    });
  }

  // Create sample audits
  const audits = [
    { title: 'User Access Review', type: 'Internal Audit', plannedDate: new Date('2025-11-18'), status: 'close', description: 'Quarterly user access review' },
    { title: 'Vendor Audit', type: 'Internal Audit', plannedDate: new Date('2025-09-09'), status: 'close' },
    { title: 'Log File Review', type: 'Internal Audit', plannedDate: new Date('2026-01-01'), status: 'close' },
    { title: 'Internal Audit', type: 'Internal Audit', plannedDate: new Date('2025-12-20'), status: 'close' },
    { title: 'Externes Audit', type: 'External Audit', plannedDate: new Date('2026-01-07'), status: 'open', description: 'The External Audit will be on the 12.02.2026' },
    { title: 'Infosec Training', type: 'Internal Audit', plannedDate: new Date('2026-01-29'), status: 'close' },
  ];

  for (const audit of audits) {
    const auditId = `audit-${audit.title.toLowerCase().replace(/\s+/g, '-').substring(0, 20)}`;
    const existing = await prisma.audit.findUnique({ where: { id: auditId } });
    
    if (!existing) {
      await prisma.audit.create({
        data: {
          id: auditId,
          organizationId: org.id,
          title: audit.title,
          type: audit.type,
          plannedDate: audit.plannedDate,
          status: audit.status,
          description: audit.description || null,
          owners: {
            create: [
              { employeeId: employees[0].id },
              { employeeId: employees[1].id },
            ],
          },
        },
      });
    }
  }

  // Count actual audits in DB
  const auditCount = await prisma.audit.count();

  console.log('✅ Seeding completed!');
  console.log(`   - Organization: ${org.name}`);
  console.log(`   - Employees: ${employees.length}`);
  console.log(`   - Controls: ${controls.length}`);
  console.log(`   - Assets: ${assets.length}`);
  console.log(`   - Risks: ${risks.length}`);
  console.log(`   - Vendors: ${vendors.length}`);
  console.log(`   - Findings: ${findings.length}`);
  console.log(`   - Audits: ${auditCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { prisma } from '../src/lib/db';
import { seedSimulations } from './seed-simulations';

async function main() {
  console.log('🌱 Seeding database...');

  // ── Organisation 1: TrustSpace ──────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: 'trustspace-org' },
    update: {},
    create: {
      id: 'trustspace-org',
      name: 'TrustSpace GmbH',
      description: 'Demo Organisation für ISMS',
      industry: 'IT & Security',
    },
  });

  // Create employees for TrustSpace
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

  // ── Organisation 2: Eduneon ──────────────────────────────────────────────────
  const eduneonOrg = await prisma.organization.upsert({
    where: { id: 'eduneon-org' },
    update: {},
    create: {
      id: 'eduneon-org',
      name: 'Eduneon GmbH',
      description: 'Demo Organisation für ISMS – EdTech',
      industry: 'Education Technology',
    },
  });

  const eduneonEmployees = await Promise.all([
    prisma.employee.upsert({
      where: { id: 'eduneon-emp-1' },
      update: {},
      create: {
        id: 'eduneon-emp-1',
        organizationId: eduneonOrg.id,
        email: 'admin@eduneon.local',
        firstName: 'Admin',
        lastName: 'Eduneon',
        role: 'Admin',
        department: 'IT',
      },
    }),
    prisma.employee.upsert({
      where: { id: 'eduneon-emp-2' },
      update: {},
      create: {
        id: 'eduneon-emp-2',
        organizationId: eduneonOrg.id,
        email: 'isb@eduneon.local',
        firstName: 'Sicherheits',
        lastName: 'Beauftragter',
        role: 'ISB',
        department: 'Security',
      },
    }),
    prisma.employee.upsert({
      where: { id: 'eduneon-emp-3' },
      update: {},
      create: {
        id: 'eduneon-emp-3',
        organizationId: eduneonOrg.id,
        email: 'dev@eduneon.local',
        firstName: 'Max',
        lastName: 'Entwickler',
        role: 'Developer',
        department: 'Engineering',
      },
    }),
  ]);

  // Create ISO 27001:2022 Controls (SOA) - all 93 controls
  const controls: { code: string; title: string; category: string; description?: string; justification?: string }[] = [
    // A.5 Organisatorische Maßnahmen (37 controls)
    { code: 'A.5.1', title: 'Informationssicherheitsrichtlinien', category: 'A.5',
      description: 'Die Informationssicherheitsrichtlinie und die themenspezifischen Richtlinien sollten festgelegt und von der Geschäftsleitung genehmigt werden. Im nächsten Schritt müssen sie für das zuständige Personal und relevante Parteien veröffentlicht werden. Die Kenntnisnahme muss getrackt werden. Die Richtlinien sollten in festgelegten Intervallen überprüft werden um Änderungen rechtzeitig zu erfassen.',
      justification: 'Die [Firmenname eintragen] hat eine ISMS-Richtlinie sowie zugehörige Leitlinien, Richtlinien und Verfahrensanweisungen eingeführt, die von der Geschäftsführung oder den Abteilungsleitern freigegeben wurden. Diese Dokumente, die Ziele der Informationssicherheit und Hinweise auf Disziplinarmaßnahmen enthalten, sind allen Mitarbeitern über das TrustSpace ISMS zugänglich gemacht worden. Ein jährlicher Review-Prozess dieser Dokumente wird durchgeführt und mithilfe der TrustSpace ISMS Software dokumentiert.' },
    { code: 'A.5.2', title: 'Informationssicherheitsrollen und -verantwortlichkeiten', category: 'A.5',
      description: 'Die Aufgaben und Zuständigkeiten im Bereich der Informationssicherheit sollten entsprechend den Bedürfnissen der Organisation zugewiesen werden.',
      justification: 'In der ISMS-Leitlinie werden Verantwortlichkeiten innerhalb des ISMS definiert. Ein aktuelles Organigramm der [Firmenname eintragen] legt klare Verantwortlichkeiten fest und wird regelmäßig aktualisiert. Für eine angemessene Ressourcenzuteilung sorgt die Geschäftsführung, indem sie einen externen Informationssicherheitsbeauftragten (ISB), [Name eintragen] von FA TrustSpace, bestellt hat.' },
    { code: 'A.5.3', title: 'Aufgabentrennung', category: 'A.5',
      description: 'Miteinander in Konflikt stehende Aufgaben und Verantwortlichkeitsbereiche sind getrennt.',
      justification: 'Klare Verantwortlichkeiten und Trennung von Aufgaben sind etabliert, um potenziellen Missbrauch oder Fehlverhalten zu verhindern, Fehler oder betrügerische Handlungen aufzudecken und die interne Kontrolle zu stärken.' },
    { code: 'A.5.4', title: 'Verantwortlichkeiten der Leitung', category: 'A.5',
      description: 'Die Geschäftsleitung sorgt dafür, dass das gesamte Personal die Anforderungen der Informationssicherheit kennt und themenspezifische Richtlinien innerhalb von internen Prozessen umsetzt und einhält.',
      justification: 'Das Management übernimmt die Verantwortung für die Informationssicherheit. Zudem sind klare Zuständigkeiten und Rollen definiert. Durch die klare Zuweisung von Verantwortlichkeiten können die Sicherheitsziele und -anforderungen effektiv kommuniziert werden.' },
    { code: 'A.5.5', title: 'Kontakt mit Behörden', category: 'A.5',
      description: 'Angemessene Kontakte mit relevanten Behörden werden gepflegt.',
      justification: 'Durch implementierte Kommunikationsprozesse und festgelegte Verantwortlichkeiten wird eine klare und etablierte Kommunikationsstruktur mit Behörden sichergestellt, um im Falle von Sicherheitsvorfällen eine schnelle Reaktion zu gewährleisten.' },
    { code: 'A.5.6', title: 'Kontakt mit speziellen Interessensgruppen', category: 'A.5',
      description: 'Angemessene Kontakte mit speziellen Interessensgruppen oder sonstigen sicherheitsorientierten Expertenforen und Fachverbänden werden gepflegt.',
      justification: 'Durch implementierte Kommunikationsprozesse und festgelegte Verantwortlichkeiten wird eine effektive Kommunikation und Zusammenarbeit mit relevanten Interessengruppen sichergestellt.' },
    { code: 'A.5.7', title: 'Erkenntnisse über Bedrohungen', category: 'A.5',
      description: 'Informationen über Bedrohungen der Informationssicherheit sollten gesammelt und analysiert werden, um eine Übersicht zu erstellen.',
      justification: 'Prozesse um ein umfassendes Verständnis der aktuellen Bedrohungslandschaft zu haben und in der Lage zu sein, rechtzeitig auf neue Bedrohungen zu reagieren, wurden implementiert.' },
    { code: 'A.5.8', title: 'Informationssicherheit im Projektmanagement', category: 'A.5',
      description: 'Informationssicherheit wird im Projektmanagement berücksichtigt, ungeachtet der Art des Projekts.',
      justification: 'Es wurden dedizierte Prozesse implementiert, um sicherzustellen, dass Informationssicherheitsaspekte von Anfang bis Ende in Projekte integriert werden.' },
    { code: 'A.5.9', title: 'Inventar der Informationen und anderen damit verbundenen Werten', category: 'A.5',
      description: 'Information und andere Werte, die mit Information und informationsverarbeitenden Einrichtungen in Zusammenhang stehen, sind erfasst und ein Inventar dieser Werte ist erstellt und wird gepflegt.',
      justification: 'Die [Firmenname einfügen] hat alle Assets identifiziert und systematisch in der ISMS-Software erfasst. Dies umfasst auch die Zuordnung zu unterstützenden Assets für eine klare Abbildung der Prozessketten. Für jedes Asset ist eine verantwortliche Person oder Abteilung definiert.' },
    { code: 'A.5.10', title: 'Zulässiger Gebrauch von Informationen und anderen damit verbundenen Werten', category: 'A.5',
      description: 'Regeln für den zulässigen Gebrauch von Information und Werten, die mit Information und informationsverarbeitenden Einrichtungen in Zusammenhang stehen, sind aufgestellt, dokumentiert und werden angewendet.',
      justification: 'Vorgaben zur Nutzung von Informationen und anderen Werten wurden implementiert, um das Risiko von Missbrauch, Verlust oder unbefugtem Zugriff zu reduzieren.' },
    { code: 'A.5.11', title: 'Rückgabe von Werten', category: 'A.5',
      description: 'Alle Beschäftigten und sonstige Benutzer geben bei Beendigung des Beschäftigungsverhältnisses sämtliche in ihrem Besitz befindlichen Werte, die der Organisation gehören, zurück.',
      justification: 'Vorgaben, dass Werte der Organisation ordnungsgemäß zurückgegeben werden, um das Risiko von Datenverlust, unbefugtem Zugriff oder Missbrauch zu minimieren, wurden implementiert.' },
    { code: 'A.5.12', title: 'Klassifizierung von Information', category: 'A.5',
      description: 'Informationen sollten entsprechend den Anforderungen der Organisation an die Informationssicherheit klassifiziert werden, auf der Grundlage von Vertraulichkeit, Integrität, Verfügbarkeit und relevanten Anforderungen interessierter Parteien.',
      justification: 'Eine Klassifizierungsmatrix für Informationswerte wurde implementiert. Diese Matrix berücksichtigt die Schutzziele der Informationssicherheit und ordnet Informationen einem definierten Klassifizierungsschema zu.' },
    { code: 'A.5.13', title: 'Kennzeichnung von Informationen', category: 'A.5',
      description: 'Ein angemessener Satz von Verfahren zur Kennzeichnung von Information ist entsprechend dem von der Organisation eingesetzten Informationsklassifizierungsschema entwickelt und umgesetzt.',
      justification: 'Informationen werden entsprechend ihres Schutzbedarfs gekennzeichnet. Durch die eindeutige Kennzeichnung können Mitarbeiter die Sensibilität der Informationen erkennen und angemessene Schutzmaßnahmen ergreifen.' },
    { code: 'A.5.14', title: 'Informationsübertragung', category: 'A.5',
      description: 'Für alle Arten der Informationsübermittlung sollten Regeln, Verfahren oder Vereinbarungen vorhanden sein.',
      justification: 'Durch die Festlegung von sicheren Übertragungsverfahren, wie verschlüsselte Kommunikation oder Nutzung gesicherter Netzwerke, wird die Vertraulichkeit, Integrität und Verfügbarkeit der übertragenen Informationen gewährleistet.' },
    { code: 'A.5.15', title: 'Zugangssteuerung', category: 'A.5',
      description: 'Regeln zur Kontrolle des physischen und logischen Zugriffs auf Informationen und zugehörige Ressourcen sollten auf der Grundlage von Geschäfts- und Informationssicherheitsanforderungen festgelegt und umgesetzt werden.',
      justification: 'Bei der [Firmenname einfügen] ist ein detailliertes Berechtigungskonzept sowie ein Identity and Access Management (IAM) Prozess für die Vergabe, Änderung und den Entzug von Zugängen/Berechtigungen implementiert.' },
    { code: 'A.5.16', title: 'Identitätsmanagement', category: 'A.5',
      description: 'Eine Organisation muss in der Lage sein zu bestimmen, wer oder was zu einem bestimmten Zeitpunkt auf Daten oder IT-Ressourcen zugreift und wie diesen Identitäten die entsprechenden Zugriffsrechte zugewiesen werden.',
      justification: 'Identitätsinformationen und Zugriffsrechte werden mittels des IAM-Prozesses verwaltet, um die Vertraulichkeit, Integrität und Verfügbarkeit von Informationen zu gewährleisten.' },
    { code: 'A.5.17', title: 'Informationen zur Authentifizierung', category: 'A.5',
      description: 'Die Zuweisung und Verwaltung von Authentifizierungsinformationen sollte durch einen Management-Prozess gesteuert werden.',
      justification: 'Die [Firmenname einfügen] setzt Active Directory zur Verwaltung von Benutzerkonten ein, wobei Sammelkonten weitestgehend vermieden werden. Für das ISMS sowie alle Microsoft Dienste ist die Zwei-Faktor-Authentifizierung (2FA) aktiviert.' },
    { code: 'A.5.18', title: 'Zugangsrechte', category: 'A.5',
      description: 'Zugriffsrechte auf Informationen und andere zugehörige Werte sollten in Übereinstimmung mit den spezifischen Richtlinien und Regeln für die Zugriffskontrolle bereitgestellt, überprüft, geändert und entfernt werden.',
      justification: 'Jeder Benutzer bekommt nur die Berechtigungen und Zugriffsrechte, die für die Ausführung seiner Aufgaben erforderlich sind. Ein umfassendes Berechtigungskonzept sowie ein strukturierter IAM-Prozess sind etabliert.' },
    { code: 'A.5.19', title: 'Informationssicherheit in Lieferantenbeziehungen', category: 'A.5',
      description: 'Es sollten Prozesse und Verfahren definiert und implementiert werden, um die mit der Nutzung der Produkte oder Dienstleistungen verbundenen Risiken des Lieferanten zu steuern.',
      justification: 'Lieferanten werden gemäß den Schutzanforderungen (Vertraulichkeit, Integrität, Verfügbarkeit) innerhalb der ISMS-Software bewertet. In Abhängigkeit von der Kritikalität der Lieferanten sind Zertifikate und Prüfberichte erforderlich.' },
    { code: 'A.5.20', title: 'Behandlung von Informationssicherheit in Lieferantenvereinbarungen', category: 'A.5',
      description: 'Je nach Art der Lieferantenbeziehung sollten die entsprechenden Anforderungen an die Informationssicherheit festgelegt und mit jedem Lieferanten individuell vereinbart werden.',
      justification: 'Lieferanten werden gemäß den Schutzanforderungen innerhalb der ISMS-Software bewertet. In den AGB werden Auditrechte festgelegt. Leistungsvereinbarungen, Datenschutzvereinbarungen und Geheimhaltungsvereinbarungen bieten zusätzliche Sicherheit.' },
    { code: 'A.5.21', title: 'Umgang mit der Informationssicherheit in der IKT-Lieferkette', category: 'A.5',
      description: 'Es sollten Prozesse und Verfahren definiert und implementiert werden, um die Risiken im Zusammenhang mit IKT-Produkten und -Dienstleistungen zu steuern.',
      justification: 'Die Informationssicherheit bei IKT-Dienstleistern wird im Rahmen des Lieferantenmanagements sichergestellt bzw. darin integriert.' },
    { code: 'A.5.22', title: 'Überwachung, Überprüfung und Änderungsmanagement von Lieferantendienstleistungen', category: 'A.5',
      description: 'Die Organisation sollte regelmäßig die Informationssicherheitspraktiken und die Leistungserbringung der Lieferanten überwachen, überprüfen, bewerten.',
      justification: 'Die Sicherheit der von Lieferanten erbrachten Dienstleistungen wird im Rahmen des Lieferantenmanagements kontinuierlich überwacht. Zudem werden regelmäßige Überprüfungen durchgeführt.' },
    { code: 'A.5.23', title: 'Informationssicherheit für die Nutzung von Cloud-Diensten', category: 'A.5',
      description: 'Die Verfahren für den Erwerb, die Nutzung, die Verwaltung und den Ausstieg von Cloud-Diensten sollten in Übereinstimmung mit den Informationssicherheitsanforderungen der Organisation festgelegt werden.',
      justification: 'Die Informationssicherheit bei Cloud-Dienstleistern wird im Rahmen des Lieferantenmanagements sichergestellt bzw. darin integriert.' },
    { code: 'A.5.24', title: 'Planung und Vorbereitung der Handhabung von Informationssicherheitsvorfällen', category: 'A.5',
      description: 'Die Organisation sollte das Management von Informationssicherheitsvorfällen planen und vorbereiten, indem sie Prozesse, Rollen und Zuständigkeiten definiert.',
      justification: 'Eine Regulatorik zum Umgang mit Informationssicherheitsereignissen wurde implementiert. Darin werden Prozesse, Rollen und Zuständigkeiten für das Management von Informationssicherheitsvorfällen definiert.' },
    { code: 'A.5.25', title: 'Beurteilung und Entscheidung über Informationssicherheitsereignisse', category: 'A.5',
      description: 'Die Organisation sollte Informationssicherheitsereignisse bewerten und entscheiden, ob sie als Informationssicherheitsvorfälle eingestuft werden sollen.',
      justification: 'Die Regulatorik zum Umgang mit Informationssicherheitsereignissen enthält eine Matrix zur Einstufung bzw. Bewertung von Informationssicherheitsereignissen.' },
    { code: 'A.5.26', title: 'Reaktion auf Informationssicherheitsvorfälle', category: 'A.5',
      description: 'Auf Vorfälle im Bereich der Informationssicherheit sollte gemäß den dokumentierten Verfahren und Prozesse reagiert werden.',
      justification: 'Reaktionspläne für Informationssicherheitsvorfälle werden innerhalb der Regulatorik zum Umgang mit Informationssicherheitsereignissen definiert.' },
    { code: 'A.5.27', title: 'Erkenntnisse aus Informationssicherheitsvorfällen', category: 'A.5',
      description: 'Die aus Informationssicherheitsvorfällen gewonnenen Erkenntnisse sollten zur Stärkung und Verbesserung der Informationssicherheitsmaßnahmen genutzt werden.',
      justification: 'Der Umgang mit Erkenntnissen aus Sicherheitsvorfällen wird innerhalb der Regulatorik definiert, um Schwachstellen zu identifizieren, zukünftige Vorfälle zu verhindern und das Sicherheitsniveau kontinuierlich zu verbessern.' },
    { code: 'A.5.28', title: 'Sammeln von Beweismaterial', category: 'A.5',
      description: 'Die Organisation sollte Prozesse für die Identifizierung, Sammlung, Erfassung und Aufbewahrung von Beweisen im Zusammenhang mit Informationssicherheitsvorfällen einführen und umsetzen.',
      justification: 'Prozesse für die Identifizierung, Sammlung, Erfassung und Aufbewahrung von Beweisen wurden implementiert und in der Regulatorik zum Umgang mit Informationssicherheitsereignissen definiert.' },
    { code: 'A.5.29', title: 'Informationssicherheit bei Störungen', category: 'A.5',
      description: 'Die Organisation sollte vorsehen, wie sie die Informationssicherheit auf einem angemessenen Niveau während Ausfallzeiten gewährleisten kann.',
      justification: 'Prozesse zum Umgang mit Notfällen und Krisen wurden im Rahmen des Notfall- und Krisenmanagements eingeführt, um die Informationssicherheit auch während Störungen aufrechtzuerhalten.' },
    { code: 'A.5.30', title: 'IKT-Bereitschaft für Business Continuity', category: 'A.5',
      description: 'Die IKT-Bereitschaft sollte auf der Grundlage der Ziele der Betriebskontinuität und der Anforderungen an die IKT-Kontinuität geplant, umgesetzt, gepflegt und getestet werden.',
      justification: 'Verfahren/Prozesse zum Umgang mit Krisen- und Notfallsituationen wurden implementiert.' },
    { code: 'A.5.31', title: 'Rechtliche, gesetzliche, regulatorische und vertragliche Anforderungen', category: 'A.5',
      description: 'Rechtliche, gesetzliche, regulatorische und vertragliche Anforderungen, die für die Informationssicherheit relevant sind, sollten ermittelt, dokumentiert und auf dem neuesten Stand gehalten werden.',
      justification: 'Alle relevanten rechtlichen, gesetzlichen, regulatorischen und vertraglichen Anforderungen im Bereich der Informationssicherheit sind identifiziert.' },
    { code: 'A.5.32', title: 'Geistige Eigentumsrechte', category: 'A.5',
      description: 'Die Organisation sollte geeignete Prozesse zum Schutz der Rechte an geistigem Eigentum einführen.',
      justification: 'Das geistige Eigentum der Organisation wird angemessen geschützt, um den unbefugten Zugriff, die unbefugte Nutzung oder den Diebstahl von proprietären Informationen zu verhindern.' },
    { code: 'A.5.33', title: 'Schutz von Aufzeichnungen', category: 'A.5',
      description: 'Aufzeichnungen sollten vor Verlust, Zerstörung, Fälschung, unbefugtem Zugriff und unbefugter Veröffentlichung geschützt werden.',
      justification: 'Durch technische und organisatorische Maßnahmen wird sichergestellt, dass sensible und geschäftsrelevante Aufzeichnungen vor unbefugtem Zugriff, Verlust, Beschädigung oder Manipulation geschützt werden.' },
    { code: 'A.5.34', title: 'Privatsphäre und Schutz von personenbezogenen Daten', category: 'A.5',
      description: 'Die Organisation sollte die Anforderungen an die Wahrung der Privatsphäre und den Schutz von personenbezogenen Daten gemäß den geltenden Gesetzen und Vorschriften ermitteln und erfüllen.',
      justification: 'Es wurde ein Datenschutz-Managementsystem (DSMS) implementiert, um den Schutz personenbezogener Informationen gemäß den geltenden Datenschutzgesetzen zu gewährleisten.' },
    { code: 'A.5.35', title: 'Unabhängige Überprüfung der Informationssicherheit', category: 'A.5',
      description: 'Der Ansatz der Organisation für das Management der Informationssicherheit sollte in geplanten Abständen oder bei wesentlichen Änderungen unabhängig überprüft werden.',
      justification: 'Externe Fachleute werden hinzugezogen, um unvoreingenommene Überprüfungen durchzuführen und mögliche Schwachstellen oder Verbesserungspotenziale innerhalb des ISMS aufzudecken.' },
    { code: 'A.5.36', title: 'Einhaltung von Richtlinien, Vorschriften und Normen für Informationssicherheit', category: 'A.5',
      description: 'Die Einhaltung der Informationssicherheitsleitlinie der Organisation, themenspezifischer Richtlinien, Regeln und Standards sollte regelmäßig überprüft werden.',
      justification: 'Im Rahmen von internen Audits und Überprüfungen sowie Schulungsmaßnahmen wird die Einhaltung der Informationssicherheitsrichtlinien sichergestellt.' },
    { code: 'A.5.37', title: 'Dokumentierte Bedienabläufe', category: 'A.5',
      description: 'Die Betriebsabläufe für Informationsverarbeitungsanlagen sollten dokumentiert und dem Personal, das sie benötigt, zur Verfügung gestellt werden.',
      justification: 'Klare und einheitliche Betriebsprozesse und Verfahren sind festgelegt und dokumentiert, um die Effizienz, Konsistenz und Sicherheit von Geschäftsabläufen zu verbessern.' },

    // A.6 Personenbezogene Maßnahmen (8 controls)
    { code: 'A.6.1', title: 'Sicherheitsüberprüfung', category: 'A.6',
      description: 'Die Überprüfung des Hintergrunds aller Kandidaten sollte vor deren Eintritt in die Organisation durchgeführt werden.',
      justification: 'Die [Firmenname einfügen] nutzt ein Bewerbungsmanagement. Im Rahmen dieses Prozesses erfolgt eine Identitätsprüfung der Bewerber durch die Überprüfung von Ausweisdokumenten sowie Plausibilitätsprüfungen.' },
    { code: 'A.6.2', title: 'Beschäftigungs- und Vertragsbedingungen', category: 'A.6',
      description: 'In den arbeitsvertraglichen Vereinbarungen sollten die Verantwortlichkeiten des Personals und der Organisation hinsichtlich der Informationssicherheit festgehalten werden.',
      justification: 'Innerhalb der ISMS-Software wird die Kenntnisnahme von Richtlinien und Verfahrensanweisungen mitarbeiterspezifisch protokolliert. Arbeitsverträge enthalten spezifische Klauseln zu Informationssicherheit und Vertraulichkeit.' },
    { code: 'A.6.3', title: 'Informationssicherheitsbewusstsein, -ausbildung und -schulung', category: 'A.6',
      description: 'Das Personal der Organisation und relevante interessierte Parteien sollten geeignete Schulungen sowie regelmäßige Auffrischungen erhalten.',
      justification: 'Mitarbeiter der [Firmenname einfügen] werden von der IT-Leitung in Zusammenarbeit mit dem ISB geschult. Schulungsmaterialien stehen jederzeit zur Verfügung. Über die ISMS Software werden zentral und rollenspezifisch Richtlinien bereitgestellt.' },
    { code: 'A.6.4', title: 'Maßregelungsprozess', category: 'A.6',
      description: 'Ein Disziplinarverfahren sollte formalisiert und kommuniziert werden, um gegen Mitarbeiter, die gegen die Informationssicherheitsleitlinie verstoßen haben, vorzugehen.',
      justification: 'Disziplinarische Prozesse wurden etabliert, um angemessene Maßnahmen gegen Mitarbeiter zu ergreifen, die gegen Sicherheitsrichtlinien verstoßen.' },
    { code: 'A.6.5', title: 'Verantwortlichkeit nach Beendigung oder Änderung der Beschäftigung', category: 'A.6',
      description: 'Verantwortlichkeiten und Pflichten im Bereich der Informationssicherheit, die auch nach dem Ausscheiden bestehen bleiben, sollten definiert und dem betreffenden Personal mitgeteilt werden.',
      justification: 'Durch den Offboarding- sowie IAM-Prozess wird sichergestellt, dass ehemalige Mitarbeiter keine unberechtigten Zugriffe auf vertrauliche Informationen oder Systeme haben.' },
    { code: 'A.6.6', title: 'Vertraulichkeits- oder Geheimhaltungsvereinbarungen', category: 'A.6',
      description: 'Vertraulichkeits- oder Geheimhaltungsvereinbarungen sollten vom Personal und anderen relevanten Parteien unterzeichnet werden.',
      justification: 'Siehe A.6.2' },
    { code: 'A.6.7', title: 'Telearbeit', category: 'A.6',
      description: 'Sicherheitsmaßnahmen sollten ergriffen werden, um sensible Informationen, die außerhalb der Räumlichkeiten der Organisation abgerufen werden, zu schützen.',
      justification: 'Für das mobile Arbeiten wurde bei der [Firmenname einfügen] eine spezielle Verfahrensanweisung erstellt. Mitarbeiter verbinden sich ausschließlich über VPN. Mobile Geräte werden über MDM verwaltet.' },
    { code: 'A.6.8', title: 'Meldung von Informationssicherheitsereignissen', category: 'A.6',
      description: 'Die Organisation sollte einen Prozess vorsehen, der es den Mitarbeitern ermöglicht, verdächtige Ereignisse zeitnah zu melden.',
      justification: 'Ein Meldesystem sowie die dazugehörigen Prozesse und eine Berichtspflicht für Mitarbeiter wurden etabliert.' },

    // A.7 Physische Maßnahmen (14 controls)
    { code: 'A.7.1', title: 'Physische Sicherheitsperimeter', category: 'A.7',
      description: 'Sicherheitszonen sollten definiert und genutzt werden, um Bereiche zu schützen, in denen sich Informationen und andere zugehörige Assets befinden.',
      justification: 'Die [Firmenname einfügen] hat ein physisches Sicherheitskonzept entwickelt, das die Unternehmensräumlichkeiten entsprechend ihrer Kritikalität in verschiedene Schutzzonen unterteilt.' },
    { code: 'A.7.2', title: 'Physischer Zutritt', category: 'A.7',
      description: 'Sicherheitsbereiche sollten durch geeignete Zugangskontrollen und Zugangspunkte geschützt werden.',
      justification: 'Durch die Implementierung geeigneter Zugangskontrollen werden unautorisierte Personen daran gehindert, in geschützte Bereiche einzudringen.' },
    { code: 'A.7.3', title: 'Sichern von Büros, Räumen und Einrichtungen', category: 'A.7',
      description: 'Die physische Sicherheit von Büros, Räumen und Anlagen sollte geplant und umgesetzt werden.',
      justification: 'Durch physische Sicherheitsvorkehrungen werden die Räumlichkeiten vor unbefugtem Zugriff, Diebstahl oder Vandalismus geschützt.' },
    { code: 'A.7.4', title: 'Physische Sicherheitsüberwachung', category: 'A.7',
      description: 'Die Räumlichkeiten sollten ständig hinsichtlich unbefugten physischen Zugangs überwacht werden.',
      justification: 'Die [Firmenname einfügen] hat Maßnahmen getroffen um ihre Räumlichkeiten hinsichtlich unbefugten Zutritts zu überwachen.' },
    { code: 'A.7.5', title: 'Schutz vor physischen und umweltbedingten Bedrohungen', category: 'A.7',
      description: 'Der Schutz vor physischen und umweltbedingten Bedrohungen sollte vorgesehen und umgesetzt werden.',
      justification: 'Durch die Implementierung von Sicherheitsvorkehrungen können potenzielle Risiken minimiert werden, die die Verfügbarkeit von Ressourcen gefährden könnten.' },
    { code: 'A.7.6', title: 'Arbeiten in Sicherheitsbereichen', category: 'A.7',
      description: 'Es sollten Sicherheitsmaßnahmen für die Arbeit in Sicherheitszonen konzipiert und umgesetzt werden.',
      justification: 'Sicherheitsmaßnahmen für Sicherheitsbereiche sind implementiert. Sensible Bereiche einschließlich Rechenzentren sind an externe Dienstleister mit hohen Sicherheitsstandards ausgelagert.' },
    { code: 'A.7.7', title: 'Aufgeräumte Arbeitsumgebung und Bildschirmsperren', category: 'A.7',
      description: 'Eine Clean-Desk Richtlinie für Unterlagen und Wechseldatenträger sollte festgelegt und angemessen durchgesetzt werden.',
      justification: 'Durch etablierte Verfahrensanweisungen wird sichergestellt, dass Mitarbeiter ihre Arbeitsbereiche aufräumen und Bildschirmsperren verwenden.' },
    { code: 'A.7.8', title: 'Platzierung und Schutz von Geräten und Betriebsmitteln', category: 'A.7',
      description: 'Geräte und Betriebsmittel sollten angemessen geschützt werden.',
      justification: 'IT-Geräte und -Systeme werden angemessen platziert und geschützt, um physische Schäden, Diebstahl oder unbefugten Zugriff zu verhindern.' },
    { code: 'A.7.9', title: 'Sicherheit von Werten außerhalb der Räumlichkeiten', category: 'A.7',
      description: 'Externe Geräte sollten angemessen geschützt werden, um Verlust, Beschädigung oder Kompromittierung zu verhindern.',
      justification: 'Umfangreiche Vorgaben zum Umgang mit IT-Geräten und mobilen Datenträgern sind implementiert. Mobile IT-Geräte sind festplattenverschlüsselt und werden über MDM verwaltet.' },
    { code: 'A.7.10', title: 'Speichermedien', category: 'A.7',
      description: 'Speichermedien sind während ihres gesamten Lebenszyklus in Übereinstimmung mit dem Klassifizierungsschema zu handhaben.',
      justification: 'Die Vorgaben zum Umgang mit Informationsträgern sind in der Klassifizierungsmatrix detailliert festgelegt. Mitarbeiter sind instruiert, keine externen Datenträger wie USB-Sticks zu verwenden.' },
    { code: 'A.7.11', title: 'Versorgungseinrichtungen', category: 'A.7',
      description: 'Informationsverarbeitungseinrichtungen sollten vor Stromausfällen und anderen Störungen geschützt werden.',
      justification: 'Diese Kontrollen sind besonders wichtig für Rechenzentren und wurden an spezialisierte Drittdienstleister ausgelagert, die die ständige Überwachung und Sicherheit gewährleisten.' },
    { code: 'A.7.12', title: 'Sicherheit der Verkabelung', category: 'A.7',
      description: 'Kabel, die Strom, Daten oder unterstützende Informationsdienste transportieren, sollten vor Abhörmaßnahmen, Störungen oder Beschädigungen geschützt werden.',
      justification: 'Die Verantwortung für die Kabelsicherheit in den Rechenzentren haben die Dienstleister sichergestellt. Diese stellen sicher, dass die Verkabelungssysteme sicher und geschützt sind.' },
    { code: 'A.7.13', title: 'Instandhalten von Geräten und Betriebsmitteln', category: 'A.7',
      description: 'Die Hardware sollte korrekt gewartet werden, um die Verfügbarkeit, Integrität und Vertraulichkeit von Informationen stets zu gewährleisten.',
      justification: 'IT-Geräte werden regelmäßig gewartet, überprüft und aktualisiert. Alle Geräte außerhalb der Garantie werden einmal jährlich einer Hardwareüberprüfung unterzogen.' },
    { code: 'A.7.14', title: 'Sichere Entsorgung oder Wiederverwendung von Geräten und Betriebsmitteln', category: 'A.7',
      description: 'Geräte, die Speichermedien enthalten, sollten überprüft werden, um sicherzustellen, dass alle sensiblen Daten entfernt oder sicher überschrieben wurden.',
      justification: 'Durch die Umsetzung sicherer Entsorgungsverfahren wie Datenlöschung, physische Zerstörung oder Zertifizierung von Recyclingdienstleistern wird sichergestellt, dass sensible Informationen nicht wiederhergestellt werden können.' },

    // A.8 Technologische Maßnahmen (34 controls)
    { code: 'A.8.1', title: 'Endpunktgeräte des Benutzers', category: 'A.8',
      description: 'Informationen, die auf Endgeräten der Nutzer gespeichert sind, verarbeitet werden oder über sie zugänglich sind, sollten angemessen geschützt werden.',
      justification: 'Sicherheitsrichtlinien wie Passwortrichtlinien, Verschlüsselung, Sicherheitspatches und Antivirensoftware wurden auf den Endgeräten implementiert.' },
    { code: 'A.8.2', title: 'Privilegierte Zugangsrechte', category: 'A.8',
      description: 'Die Vergabe und Nutzung von privilegierten Zugangsrechten sollte eingeschränkt und kontrolliert gesteuert werden.',
      justification: 'Privilegierte Zugangsrechte werden strikt nach dem Identity and Access Management (IAM)-Prozess beantragt und gemäß dessem auch regelmäßig überprüft.' },
    { code: 'A.8.3', title: 'Informationszugangsbeschränkung', category: 'A.8',
      description: 'Der Zugang zu Informationen und anderen zugehörigen Assets sollte in Übereinstimmung mit der festgelegten spezifischen Richtlinien zur Zugangskontrolle aktiv eingeschränkt werden.',
      justification: 'Neue Berechtigungen bei der [Firmenname einfügen] werden strikt nach dem IAM-Prozess beantragt. Alle Freigaben werden dokumentiert und ausschließlich vom jeweiligen Abteilungsleiter erteilt.' },
    { code: 'A.8.4', title: 'Zugriff auf den Quellcode', category: 'A.8',
      description: 'Der Lese- und Schreibzugriff auf Quellcode, Entwicklungswerkzeuge und Softwarebibliotheken sollte angemessen verwaltet und geschützt werden.',
      justification: 'Siehe A.8.3.' },
    { code: 'A.8.5', title: 'Sichere Authentifizierung', category: 'A.8',
      description: 'Sichere Authentifizierungstechnologien und -verfahren sollten auf der Grundlage von Zugangsbeschränkungen implementiert werden.',
      justification: 'Starke Authentifizierungsmethoden wie Passwörter, Zwei-Faktor-Authentifizierung und MFA wurden implementiert.' },
    { code: 'A.8.6', title: 'Kapazitätssteuerung', category: 'A.8',
      description: 'Die Nutzung der Kapazitäten sollte überwacht und entsprechend dem aktuellen und erwarteten Kapazitätsbedarf angepasst werden.',
      justification: 'Durch regelmäßige Überwachung der Systemleistung und Skalierung der Ressourcen wird eine effiziente Nutzung der Kapazität gewährleistet.' },
    { code: 'A.8.7', title: 'Schutz gegen Schadsoftware', category: 'A.8',
      description: 'Der Schutz vor Schadprogrammen sollte durch eine angemessene Sensibilisierung der Mitarbeiter unterstützt werden.',
      justification: '[Firmenname einfügen] hat eine Antivirus Software und Firewall-System unternehmensweit implementiert, die auf allen Geräten aktiv ist und nicht deaktiviert werden kann.' },
    { code: 'A.8.8', title: 'Handhabung technischer Schwachstellen', category: 'A.8',
      description: 'Es sollten Informationen über technische Schwachstellen der verwendeten informationstechnischen Systeme eingeholt werden.',
      justification: 'Die [Firmenname einfügen] stellt durch regelmäßige Überprüfungen sicher, dass alle Endgeräte mit den neuesten Sicherheitspatches ausgestattet sind. Updates für Cloud-Software werden durch die Anbieter durchgeführt.' },
    { code: 'A.8.9', title: 'Konfigurationsmanagement', category: 'A.8',
      description: 'Konfigurationen, einschließlich Sicherheitskonfigurationen, von Hardware, Software, Diensten und Netzen sollten festgelegt, dokumentiert, umgesetzt, überwacht und überprüft werden.',
      justification: 'Konfigurationsänderungen werden überwacht. Dies umfasst die Durchsetzung von Sicherheitsrichtlinien und die Aktualisierung von Systemdokumentationen.' },
    { code: 'A.8.10', title: 'Löschung von Informationen', category: 'A.8',
      description: 'Informationen, die in Informationssystemen gespeichert sind, sollten gelöscht werden wenn sie nicht mehr benötigt werden.',
      justification: 'Ein Löschkonzept liegt vor. Sichere Löschmethoden wie Datenüberschreibung, physische Zerstörung sowie eine Datenlöschsoftware wurden implementiert.' },
    { code: 'A.8.11', title: 'Datenmaskierung', category: 'A.8',
      description: 'Die Datenmaskierung sollte in Übereinstimmung mit der spezifischen Richtlinie der Organisation zur Zugriffskontrolle berücksichtigt werden.',
      justification: 'Durch das Maskieren oder Anonymisieren von Daten wird sichergestellt, dass sensible Informationen nicht offengelegt werden.' },
    { code: 'A.8.12', title: 'Verhinderung von Datenlecks', category: 'A.8',
      description: 'Maßnahmen zur Verhinderung von Datenverlusten sollten auf Systeme, Netzwerke und andere Geräte angewendet werden, die sensible Informationen verarbeiten.',
      justification: 'Durch den Einsatz von Technologien und Richtlinien wie DLP-Lösungen, Verschlüsselung und Zugriffskontrollen werden potenzielle Datenlecks erkannt und verhindert.' },
    { code: 'A.8.13', title: 'Sicherung von Informationen', category: 'A.8',
      description: 'Backups von Informationen, Software und Systemen sollten aufbewahrt und regelmäßig getestet werden.',
      justification: 'Backup-Strategien und -Prozesse, einschließlich regelmäßiger Sicherungen, Überprüfung der Integrität der Backups und Offsite-Speicherung wurden implementiert.' },
    { code: 'A.8.14', title: 'Redundanz von informationsverarbeitenden Einrichtungen', category: 'A.8',
      description: 'Die Einrichtungen zur Informationsverarbeitung sollten so redundant ausgelegt sein, dass sie den Anforderungen an die Verfügbarkeit gerecht werden.',
      justification: 'Redundante Systeme wie Backup-Server, Notstromversorgung oder Spiegelung von Daten sind eingerichtet.' },
    { code: 'A.8.15', title: 'Protokollierung', category: 'A.8',
      description: 'Protokolle, die Aktivitäten, Ausnahmen, Fehler und andere relevante Ereignisse aufzeichnen, sollten erstellt, gespeichert, geschützt und ausgewertet werden.',
      justification: 'Ereignisprotokolle werden regelmäßig kontrolliert, und bei Unregelmäßigkeiten erfolgen automatische Benachrichtigungen.' },
    { code: 'A.8.16', title: 'Überwachung von Aktivitäten', category: 'A.8',
      description: 'Netzwerke, Systeme und Anwendungen sollten auf anomales Verhalten überwacht werden.',
      justification: 'Eine kontinuierliche Überwachung von Netzwerkverkehr, Systemlogs und Benutzeraktivitäten findet statt, um verdächtige Muster zu identifizieren.' },
    { code: 'A.8.17', title: 'Uhrensynchronisation', category: 'A.8',
      description: 'Die Uhren der von der Organisation genutzten Informationsverarbeitungssysteme sollten mit genehmigten Zeitquellen synchronisiert werden.',
      justification: 'Alle beteiligten IT-Systeme verfügen über eine genaue und synchronisierte Zeit.' },
    { code: 'A.8.18', title: 'Gebrauch von Hilfsprogrammen mit privilegierten Rechten', category: 'A.8',
      description: 'Die Verwendung von Utility-Programmen, die in der Lage sind, System- und Anwendungssteuerungen außer Kraft zu setzen, sollte eingeschränkt und streng kontrolliert werden.',
      justification: '[Kundenindividuell ausfüllen]' },
    { code: 'A.8.19', title: 'Installation von Software auf Systemen im Betrieb', category: 'A.8',
      description: 'Es sollten Verfahren und Maßnahmen zur sicheren Verwaltung der Softwareinstallation auf betrieblichen Systemen implementiert werden.',
      justification: 'Durch die Einführung von Richtlinien und Genehmigungsverfahren wird sichergestellt, dass nur vertrauenswürdige und geprüfte Software auf produktiven Systemen installiert werden.' },
    { code: 'A.8.20', title: 'Netzwerksicherheit', category: 'A.8',
      description: 'Netze und Netzkomponenten sollten gesichert, verwaltet und kontrolliert werden.',
      justification: 'Durch die Implementierung von Firewalls, Intrusion Detection/Prevention-Systemen, Verschlüsselung, Netzwerksegmentierung und Zugriffskontrollen werden die Netzwerke geschützt.' },
    { code: 'A.8.21', title: 'Sicherheit von Netzwerkdiensten', category: 'A.8',
      description: 'Es sollten Sicherheitsmechanismen und SLAs für Netzdienste ermittelt, umgesetzt und überwacht werden.',
      justification: 'Durch die Konfiguration von Sicherheitseinstellungen, regelmäßige Aktualisierung und Überwachung von Netzwerkdiensten wird die Sicherheit und Zuverlässigkeit sichergestellt.' },
    { code: 'A.8.22', title: 'Trennung von Netzwerken', category: 'A.8',
      description: 'Gruppen von Informationsdiensten, Benutzern und Informationssystemen sollten in der Organisation getrennt werden.',
      justification: '[Kundenindividuell ausfüllen]' },
    { code: 'A.8.23', title: 'Webfilterung', category: 'A.8',
      description: 'Der Zugang zu externen Websites sollte verwaltet werden, um die Gefährdung durch bösartige Inhalte zu verringern.',
      justification: 'Durch den Einsatz von Webfiltern, die basierend auf definierten Regeln den Zugriff auf bestimmte Websites blockieren oder überwachen, werden potenzielle Bedrohungen eingeschränkt.' },
    { code: 'A.8.24', title: 'Verwendung von Kryptographie', category: 'A.8',
      description: 'Es sollten Regeln für den wirksamen Einsatz von Kryptographie, einschließlich der Verwaltung kryptographischer Schlüssel, festgelegt und umgesetzt werden.',
      justification: 'Vorgaben zum Einsatz von Kryptographie sowie der Verwaltung von kryptographischen Schlüsseln wurden implementiert. Das WLAN-Netzwerk ist gemäß dem WPA2-Standard verschlüsselt.' },
    { code: 'A.8.25', title: 'Lebenszyklus einer sicheren Entwicklung', category: 'A.8',
      description: 'Es sollten Regeln für die sichere Entwicklung von Software und Systemen aufgestellt und angewendet werden.',
      justification: 'Eine Richtlinie zur sicheren Entwicklung wurde implementiert. Informationssicherheitsaspekte werden in jeder Phase des Softwareentwicklungsprozesses einbezogen.' },
    { code: 'A.8.26', title: 'Anforderungen an die Anwendungssicherheit', category: 'A.8',
      description: 'Bei der Entwicklung oder Beschaffung von Anwendungen sollten die Anforderungen an die Informationssicherheit ermittelt, spezifiziert und bestätigt werden.',
      justification: 'Durch die Implementierung klarer Sicherheitsanforderungen stellen die Entwickler sicher, dass Anwendungen sicher entworfen, entwickelt und getestet werden.' },
    { code: 'A.8.27', title: 'Sichere Systemarchitektur und technische Grundsätze', category: 'A.8',
      description: 'Es sollten Grundsätze für die Entwicklung sicherer Systeme festgelegt, dokumentiert, gepflegt und angewendet werden.',
      justification: 'Durch die Berücksichtigung von Sicherheitsaspekten bei der Planung, Gestaltung und Entwicklung von IT-Systemen werden potenzielle Sicherheitsrisiken vermieden.' },
    { code: 'A.8.28', title: 'Sichere Kodierung', category: 'A.8',
      description: 'Bei der Softwareentwicklung sollten die Grundsätze der sicheren Kodierung angewandt werden.',
      justification: 'Siehe A.8.25.' },
    { code: 'A.8.29', title: 'Sicherheitsprüfung in Entwicklung und Abnahme', category: 'A.8',
      description: 'Sicherheitsprüfverfahren sollten definiert und in den Entwicklungslebenszyklus integriert werden.',
      justification: 'Wird im Rahmen der Richtlinie zur sicheren Entwicklung berücksichtigt, siehe A.8.25.' },
    { code: 'A.8.30', title: 'Ausgegliederte Entwicklung', category: 'A.8',
      description: 'Die Organisation sollte die Aktivitäten im Zusammenhang mit der ausgelagerten Systementwicklung leiten, überwachen und überprüfen.',
      justification: 'Sicherheitsrichtlinien und -praktiken der Dienstleister werden überprüft. Vertragliche Verpflichtungen zum Schutz von Daten und geistigem Eigentum werden festgelegt.' },
    { code: 'A.8.31', title: 'Trennung von Entwicklungs-, Prüf- und Produktionsumgebungen', category: 'A.8',
      description: 'Entwicklungs-, Test- und Produktionsumgebungen sollten getrennt und gesichert sein.',
      justification: 'Entwicklung, Tests und Produktionsumgebungen werden voneinander getrennt, um zu verhindern, dass nicht getestete Komponenten in den Live-Betrieb gelangen.' },
    { code: 'A.8.32', title: 'Änderungssteuerung', category: 'A.8',
      description: 'Änderungen an Informationsverarbeitungseinrichtungen und Informationssystemen sollten Gegenstand des Change Managements sein.',
      justification: 'Änderungen werden durch einen strukturierten Change Management Workflow überwacht und mittels eines formalen Antragsverfahrens dokumentiert.' },
    { code: 'A.8.33', title: 'Informationen zur Prüfung', category: 'A.8',
      description: 'Die Testdaten sollten angemessen ausgewählt, geschützt und verwaltet werden.',
      justification: 'Testdaten, Testumgebungen und andere testbezogene Informationen werden angemessen geschützt.' },
    { code: 'A.8.34', title: 'Schutz der Informationssysteme während der Überwachungsprüfung', category: 'A.8',
      description: 'Audit-Tests und andere Prüfungen, die eine Bewertung der operativen Systeme beinhalten, sollten zwischen dem Prüfer und dem zuständigen Management geplant und vereinbart werden.',
      justification: '[Durchgeführte oder geplante Audits, wie z.B. Pentests, von Informationssystemen beschreiben.]' },
  ];

  // Seed controls for TrustSpace
  for (const control of controls) {
    await prisma.control.upsert({
      where: { id: `control-${control.code}` },
      update: { title: control.title, description: control.description || `ISO 27001:2022 Control ${control.code}` },
      create: {
        id: `control-${control.code}`,
        organizationId: org.id,
        code: control.code,
        title: control.title,
        isApplicable: true,
        description: control.description || `ISO 27001:2022 Control ${control.code}`,
        justification: control.justification || null,
      },
    });
  }

  // Seed controls for Eduneon
  for (const control of controls) {
    await prisma.control.upsert({
      where: { id: `eduneon-control-${control.code}` },
      update: { title: control.title, description: control.description || `ISO 27001:2022 Control ${control.code}` },
      create: {
        id: `eduneon-control-${control.code}`,
        organizationId: eduneonOrg.id,
        code: control.code,
        title: control.title,
        isApplicable: true,
        description: control.description || `ISO 27001:2022 Control ${control.code}`,
        justification: control.justification || null,
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

  // ── Eduneon sample data ──────────────────────────────────────────────────────
  const eduneonAssets = [
    { name: 'Lernplattform', type: 'primary', category: 'software', confidentiality: 4, integrity: 5, availability: 5 },
    { name: 'Schülerdaten', type: 'primary', category: 'information', confidentiality: 5, integrity: 4, availability: 3 },
    { name: 'Video-Server', type: 'secondary', category: 'hardware', confidentiality: 3, integrity: 3, availability: 5 },
    { name: 'Kurs-Datenbank', type: 'secondary', category: 'software', confidentiality: 4, integrity: 5, availability: 4 },
  ];

  for (const asset of eduneonAssets) {
    await prisma.asset.upsert({
      where: { id: `eduneon-asset-${asset.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `eduneon-asset-${asset.name.toLowerCase().replace(/\s+/g, '-')}`,
        organizationId: eduneonOrg.id,
        name: asset.name,
        type: asset.type,
        category: asset.category,
        confidentiality: asset.confidentiality,
        integrity: asset.integrity,
        availability: asset.availability,
        ownerId: eduneonEmployees[0].id,
      },
    });
  }

  const eduneonRisks = [
    { title: 'Datenleck Schülerdaten', bruttoProbability: 3, bruttoImpact: 5, nettoProbability: 2, nettoImpact: 4 },
    { title: 'Ausfall Lernplattform', bruttoProbability: 2, bruttoImpact: 5, nettoProbability: 1, nettoImpact: 4 },
    { title: 'Phishing gegen Lehrkräfte', bruttoProbability: 4, bruttoImpact: 3, nettoProbability: 2, nettoImpact: 2 },
  ];

  for (const risk of eduneonRisks) {
    await prisma.risk.upsert({
      where: { id: `eduneon-risk-${risk.title.toLowerCase().replace(/\s+/g, '-').substring(0, 24)}` },
      update: {},
      create: {
        id: `eduneon-risk-${risk.title.toLowerCase().replace(/\s+/g, '-').substring(0, 24)}`,
        organizationId: eduneonOrg.id,
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

  const eduneonVendors = [
    { name: 'Moodle', category: 'LMS', services: 'Learning Management System', gdprCompliant: true },
    { name: 'Zoom', category: 'Video Conferencing', services: 'Online Meetings', gdprCompliant: false },
    { name: 'Google Workspace', category: 'Productivity', services: 'Gmail, Drive, Docs', gdprCompliant: true },
  ];

  for (const vendor of eduneonVendors) {
    await prisma.vendor.upsert({
      where: { id: `eduneon-vendor-${vendor.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `eduneon-vendor-${vendor.name.toLowerCase().replace(/\s+/g, '-')}`,
        organizationId: eduneonOrg.id,
        name: vendor.name,
        category: vendor.category,
        services: vendor.services,
        gdprCompliant: vendor.gdprCompliant,
      },
    });
  }

  const eduneonFindings = [
    { title: 'DSGVO-Schulung für Lehrkräfte', type: 'improvement', priority: 'high', status: 'open' },
    { title: 'Backup-Konzept Kurs-Datenbank', type: 'improvement', priority: 'medium', status: 'in_progress' },
    { title: '2FA für Admin-Zugänge aktivieren', type: 'task', priority: 'high', status: 'open' },
  ];

  for (const finding of eduneonFindings) {
    await prisma.finding.upsert({
      where: { id: `eduneon-finding-${finding.title.toLowerCase().replace(/\s+/g, '-').substring(0, 24)}` },
      update: {},
      create: {
        id: `eduneon-finding-${finding.title.toLowerCase().replace(/\s+/g, '-').substring(0, 24)}`,
        organizationId: eduneonOrg.id,
        title: finding.title,
        type: finding.type,
        priority: finding.priority,
        status: finding.status,
        assigneeId: eduneonEmployees[1].id,
      },
    });
  }

  // Seed simulation scenarios (org-independent)
  await seedSimulations();

  console.log('✅ Seeding completed!');
  console.log(`   - Organization 1: ${org.name} (${org.id})`);
  console.log(`   - Organization 2: ${eduneonOrg.name} (${eduneonOrg.id})`);
  console.log(`   - TrustSpace Employees: ${employees.length}`);
  console.log(`   - Eduneon Employees: ${eduneonEmployees.length}`);
  console.log(`   - Controls per org: ${controls.length}`);
  console.log(`   - TrustSpace Assets: ${assets.length}`);
  console.log(`   - Eduneon Assets: ${eduneonAssets.length}`);
  console.log(`   - TrustSpace Risks: ${risks.length}`);
  console.log(`   - Eduneon Risks: ${eduneonRisks.length}`);
  console.log(`   - Vendors: ${vendors.length} + ${eduneonVendors.length}`);
  console.log(`   - Findings: ${findings.length} + ${eduneonFindings.length}`);
  console.log(`   - Audits: ${auditCount}`);
  console.log(`   - Simulation Scenarios: 4`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

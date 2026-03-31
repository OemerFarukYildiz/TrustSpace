import { getOrgId } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";


interface ControlData {
  code: string;
  title: string;
  description: string;
  justification: string | null;
}

const controls: ControlData[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // A.5 Organisatorische Maßnahmen (37 controls)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    code: "A.5.1",
    title: "Informationssicherheitsrichtlinien",
    description:
      "Die Informationssicherheitsrichtlinie und die themenspezifischen Richtlinien sollten festgelegt und von der Geschäftsleitung genehmigt werden, veröffentlicht, den zuständigen Mitarbeitern und einschlägigen interessierten Parteien kommuniziert und in geplanten Abständen sowie bei erheblichen Veränderungen überprüft werden.",
    justification:
      "Die [Firmenname eintragen] hat eine ISMS-Richtlinie sowie zugehörige themenspezifische Richtlinien definiert, die von der Geschäftsführung genehmigt wurden. Die Richtlinien werden allen Mitarbeitern kommuniziert und sind im internen Intranet zugänglich. Eine jährliche Überprüfung ist im ISMS-Kalender fest verankert.",
  },
  {
    code: "A.5.2",
    title: "Informationssicherheitsrollen und -verantwortlichkeiten",
    description:
      "Informationssicherheitsrollen und -verantwortlichkeiten sollten entsprechend den Bedürfnissen der Organisation definiert und zugewiesen werden.",
    justification:
      "Bei der [Firmenname eintragen] sind Informationssicherheitsrollen klar definiert. Ein Informationssicherheitsbeauftragter (ISB) ist benannt und seine Verantwortlichkeiten sind im Organigramm sowie in den Stellenbeschreibungen dokumentiert. Weitere sicherheitsrelevante Rollen (z. B. Datenschutzbeauftragter, IT-Leiter) sind ebenfalls zugewiesen.",
  },
  {
    code: "A.5.3",
    title: "Aufgabentrennung",
    description:
      "Konfligierende Aufgaben und Verantwortungsbereiche sollten getrennt werden.",
    justification:
      "Die [Firmenname eintragen] hat Aufgabentrennung als Prinzip in den relevanten Prozessen verankert. Kritische Tätigkeiten wie Genehmigung von Zugriffsrechten, Durchführung von Zahlungen und Administration von Systemen sind auf verschiedene Personen aufgeteilt, um Interessenkonflikte und Missbrauch zu vermeiden.",
  },
  {
    code: "A.5.4",
    title: "Verantwortlichkeiten der Leitung",
    description:
      "Die Leitung sollte von allen Mitarbeitern verlangen, die Informationssicherheit gemäß den festgelegten Richtlinien, themenspezifischen Richtlinien und Verfahren der Organisation anzuwenden.",
    justification:
      "Die Geschäftsführung der [Firmenname eintragen] hat die Informationssicherheitspolitik unterzeichnet und kommuniziert aktiv deren Bedeutung. Führungskräfte sind verpflichtet, die Einhaltung von Sicherheitsrichtlinien in ihren Teams sicherzustellen und werden in regelmäßigen Management-Reviews einbezogen.",
  },
  {
    code: "A.5.5",
    title: "Kontakt mit Behörden",
    description:
      "Die Organisation sollte Kontakte zu relevanten Behörden aufbauen und pflegen.",
    justification:
      "Die [Firmenname eintragen] hat Ansprechpartner bei relevanten Behörden (z. B. BSI, Datenschutzbehörde, lokale Strafverfolgung) identifiziert und dokumentiert. Kontaktinformationen werden aktuell gehalten und im Sicherheitsvorfallsplan referenziert.",
  },
  {
    code: "A.5.6",
    title: "Kontakt mit speziellen Interessensgruppen",
    description:
      "Die Organisation sollte Kontakte zu speziellen Interessengruppen oder anderen spezialisierten Sicherheitsforen und Berufsverbänden aufbauen und pflegen.",
    justification:
      "Die [Firmenname eintragen] ist in relevanten Branchennetzwerken und Sicherheitsverbänden aktiv (z. B. ISACA, BSI-Netzwerk). Mitarbeiter nehmen regelmäßig an Fachveranstaltungen und Informationsaustausch-Runden zu aktuellen Bedrohungslagen teil.",
  },
  {
    code: "A.5.7",
    title: "Erkenntnisse über Bedrohungen",
    description:
      "Informationen über Informationssicherheitsbedrohungen sollten gesammelt und analysiert werden, um Erkenntnisse über Bedrohungen zu gewinnen.",
    justification:
      "Die [Firmenname eintragen] abonniert Threat-Intelligence-Feeds (z. B. CERT-Bund, BSI-Warnmeldungen) und wertet diese regelmäßig aus. Erkenntnisse werden im Risikomanagementsystem erfasst und bei der Bewertung von Risiken und Maßnahmen berücksichtigt.",
  },
  {
    code: "A.5.8",
    title: "Informationssicherheit im Projektmanagement",
    description:
      "Informationssicherheit sollte in das Projektmanagement integriert werden.",
    justification:
      "Bei der [Firmenname eintragen] wird Informationssicherheit als fester Bestandteil des Projektlebenszyklus behandelt. In der Projektinitiierungsphase wird ein Sicherheits-Assessment durchgeführt. Der ISB ist in relevante Projekte eingebunden und Sicherheitsanforderungen werden in Projektplänen dokumentiert.",
  },
  {
    code: "A.5.9",
    title: "Inventar der Informationen und anderen damit verbundenen Werten",
    description:
      "Ein Inventar der Informationen und anderen damit verbundenen Werte, einschließlich Eigentümer, sollte entwickelt und gepflegt werden.",
    justification:
      "Die [Firmenname eintragen] führt ein Asset-Register, das alle relevanten Informationswerte, Systeme und Infrastrukturkomponenten erfasst. Jeder Wert ist einem Eigentümer zugeordnet. Das Inventar wird mindestens jährlich sowie bei wesentlichen Änderungen aktualisiert.",
  },
  {
    code: "A.5.10",
    title:
      "Zulässiger Gebrauch von Informationen und anderen damit verbundenen Werten",
    description:
      "Regeln für den zulässigen Gebrauch und Verfahren für den Umgang mit Informationen und anderen damit verbundenen Werten sollten identifiziert, dokumentiert und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] hat eine Richtlinie zur akzeptablen Nutzung von Informationswerten verabschiedet. Diese regelt den Umgang mit Unternehmensgeräten, Softwarelizenzen, Internet und E-Mail sowie den Schutz von Unternehmensinformationen auf privaten Geräten. Mitarbeiter werden bei der Einstellung und jährlich geschult.",
  },
  {
    code: "A.5.11",
    title: "Rückgabe von Werten",
    description:
      "Mitarbeiter und andere interessierte externe Parteien sollten alle Vermögenswerte der Organisation zurückgeben, sobald ihr Beschäftigungsverhältnis, Vertrag oder die Vereinbarung endet.",
    justification:
      "Der Offboarding-Prozess der [Firmenname eintragen] umfasst eine Checkliste zur Rückgabe aller Unternehmensgeräte, Zugangskarten und sonstiger Werte. Der Prozess wird durch die HR-Abteilung koordiniert und die vollständige Rückgabe wird dokumentiert.",
  },
  {
    code: "A.5.12",
    title: "Klassifizierung von Information",
    description:
      "Informationen sollten entsprechend den Informationssicherheitsanforderungen der Organisation auf der Grundlage von Vertraulichkeit, Integrität, Verfügbarkeit und den relevanten Anforderungen der interessierten Parteien klassifiziert werden.",
    justification:
      "Die [Firmenname eintragen] hat ein Klassifizierungsschema für Informationen eingeführt (öffentlich, intern, vertraulich, streng vertraulich). Alle Informationsbestände werden entsprechend klassifiziert und Mitarbeiter sind darin geschult, mit Informationen gemäß ihrer Klassifizierung umzugehen.",
  },
  {
    code: "A.5.13",
    title: "Kennzeichnung von Informationen",
    description:
      "Es sollte ein geeignetes Verfahren zur Kennzeichnung von Informationen entsprechend dem von der Organisation eingeführten Informationsklassifizierungsschema entwickelt und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] kennzeichnet Dokumente und Datenträger entsprechend dem Klassifizierungsschema. Für elektronische Dokumente werden Header/Footer-Kennzeichnungen verwendet. Physische Dokumente werden mit entsprechenden Stempeln oder Deckblättern versehen. Mitarbeiter sind in der korrekten Kennzeichnung geschult.",
  },
  {
    code: "A.5.14",
    title: "Informationsübertragung",
    description:
      "Es sollten Informationsübertragungsregeln, -verfahren oder -vereinbarungen für alle Arten von Übertragungseinrichtungen innerhalb der Organisation und zwischen der Organisation und anderen Parteien vorhanden sein.",
    justification:
      "Die [Firmenname eintragen] hat Richtlinien für die sichere Übertragung von Informationen etabliert. Vertrauliche Informationen werden nur über verschlüsselte Kanäle übertragen (TLS für E-Mail, VPN für Remote-Zugriff, sichere Dateiübertragungsplattformen). Mitarbeiter sind in den Anforderungen geschult.",
  },
  {
    code: "A.5.15",
    title: "Zugangssteuerung",
    description:
      "Regeln zur Steuerung des physischen und logischen Zugangs zu Informationen und anderen damit verbundenen Werten sollten auf der Grundlage von Informationssicherheits- und Geschäftsanforderungen festgelegt und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] hat eine Zugangssteuerungsrichtlinie implementiert, die auf dem Prinzip der geringsten Rechte (Least Privilege) basiert. Zugriffsrechte werden rollenbasiert vergeben, regelmäßig überprüft und umgehend bei Änderungen im Beschäftigungsverhältnis angepasst.",
  },
  {
    code: "A.5.16",
    title: "Identitätsmanagement",
    description:
      "Der vollständige Lebenszyklus der Identitäten sollte verwaltet werden.",
    justification:
      "Die [Firmenname eintragen] betreibt ein zentrales Identity-Management-System. Identitäten werden bei Einstellung angelegt, bei Rollenwechsel angepasst und bei Austritt deaktiviert. Eindeutige Benutzerkennungen werden verwendet und der Prozess ist dokumentiert und wird regelmäßig überprüft.",
  },
  {
    code: "A.5.17",
    title: "Informationen zur Authentifizierung",
    description:
      "Die Zuweisung und Verwaltung von Authentifizierungsinformationen sollte durch einen Verwaltungsprozess gesteuert werden, einschließlich der Beratung des Personals über den angemessenen Umgang mit Authentifizierungsinformationen.",
    justification:
      "Die [Firmenname eintragen] hat Passwortrichtlinien definiert (Mindestlänge, Komplexität, Ablaufdatum). Ein Passwort-Manager wird für die Verwaltung dienstlicher Passwörter bereitgestellt. Mitarbeiter werden in der sicheren Handhabung von Authentifizierungsdaten geschult.",
  },
  {
    code: "A.5.18",
    title: "Zugangsrechte",
    description:
      "Zugangsrechte zu Informationen und anderen damit verbundenen Werten sollten entsprechend der themenspezifischen Richtlinie und den Regeln zur Zugangssteuerung bereitgestellt, überprüft, geändert und entzogen werden.",
    justification:
      "Die [Firmenname eintragen] verwaltet Zugriffsrechte über einen formellen Prozess. Neubeantragungen werden vom jeweiligen Vorgesetzten und dem IT-Team genehmigt. Rechte werden quartalsweise im Rahmen von User-Access-Reviews geprüft und bei Personalabgängen sofort gesperrt. Der Prozess ist vollständig dokumentiert.",
  },
  {
    code: "A.5.19",
    title: "Informationssicherheit in Lieferantenbeziehungen",
    description:
      "Prozesse und Verfahren sollten definiert und umgesetzt werden, um die Informationssicherheitsrisiken im Zusammenhang mit der Nutzung der Produkte oder Dienstleistungen des Lieferanten zu steuern.",
    justification:
      "Die [Firmenname eintragen] hat einen Lieferantenmanagementprozess etabliert. Vor der Beauftragung werden Lieferanten auf ihre Informationssicherheitsstandards geprüft. Sicherheitsanforderungen werden in Verträgen verankert und die Einhaltung wird regelmäßig überprüft.",
  },
  {
    code: "A.5.20",
    title:
      "Behandlung von Informationssicherheit in Lieferantenvereinbarungen",
    description:
      "Relevante Informationssicherheitsanforderungen sollten auf der Grundlage der Art des Lieferantenzugangs zu den Informationen und anderen damit verbundenen Werten der Organisation mit jedem Lieferanten festgelegt und vereinbart werden.",
    justification:
      "Die [Firmenname eintragen] schließt mit allen Lieferanten, die Zugang zu Informationswerten haben, entsprechende Geheimhaltungsvereinbarungen (NDAs) und Auftragsverarbeitungsverträge (AVV) ab. Sicherheitsanforderungen sind standardmäßiger Bestandteil der Lieferantenverträge.",
  },
  {
    code: "A.5.21",
    title: "Umgang mit der Informationssicherheit in der IKT-Lieferkette",
    description:
      "Prozesse und Verfahren zur Verwaltung der Informationssicherheitsrisiken im Zusammenhang mit dem IKT-Produkte- und Dienstleistungsangebot sollten definiert und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] berücksichtigt bei der Beschaffung von IKT-Produkten und -Diensten Sicherheitsaspekte der gesamten Lieferkette. Software-Herkunft wird überprüft, Lieferanten werden auf bekannte Sicherheitsvorfälle geprüft und Abhängigkeiten in der Lieferkette werden erfasst.",
  },
  {
    code: "A.5.22",
    title:
      "Überwachung, Überprüfung und Änderungsmanagement von Lieferantendienstleistungen",
    description:
      "Die Organisation sollte die Informationssicherheitspraktiken und die Serviceerbringung der Lieferanten regelmäßig überwachen, überprüfen, bewerten und Änderungen verwalten.",
    justification:
      "Die [Firmenname eintragen] führt regelmäßige Reviews der Lieferantenperformance durch, einschließlich der Überprüfung von Sicherheitsberichten und Zertifizierungen (z. B. ISO 27001, SOC 2). Wesentliche Änderungen bei Lieferanten werden über ein formelles Änderungsmanagement gesteuert.",
  },
  {
    code: "A.5.23",
    title: "Informationssicherheit für die Nutzung von Cloud-Diensten",
    description:
      "Prozesse für die Beschaffung, Nutzung, Verwaltung und den Ausstieg aus Cloud-Diensten sollten entsprechend den Informationssicherheitsanforderungen der Organisation festgelegt werden.",
    justification:
      "Die [Firmenname eintragen] hat eine Cloud-Nutzungsrichtlinie definiert, die Anforderungen an die Auswahl, Konfiguration und Nutzung von Cloud-Diensten regelt. Cloud-Anbieter werden nach Sicherheitskriterien ausgewählt und die Konfigurationen werden regelmäßig auf Einhaltung der Sicherheitsanforderungen überprüft.",
  },
  {
    code: "A.5.24",
    title:
      "Planung und Vorbereitung der Handhabung von Informationssicherheitsvorfällen",
    description:
      "Die Organisation sollte die Handhabung von Informationssicherheitsvorfällen durch Festlegung, Einrichtung und Kommunikation von Prozessen, Rollen und Verantwortlichkeiten für die Handhabung von Informationssicherheitsvorfällen planen und vorbereiten.",
    justification:
      "Die [Firmenname eintragen] hat einen Incident-Response-Plan etabliert, der Rollen, Verantwortlichkeiten und Verfahren für die Behandlung von Sicherheitsvorfällen definiert. Das zuständige Team wird regelmäßig in Incident-Response-Übungen trainiert und der Plan wird jährlich überprüft.",
  },
  {
    code: "A.5.25",
    title:
      "Beurteilung und Entscheidung über Informationssicherheitsereignisse",
    description:
      "Die Organisation sollte Informationssicherheitsereignisse beurteilen und entscheiden, ob sie als Informationssicherheitsvorfälle einzustufen sind.",
    justification:
      "Die [Firmenname eintragen] hat Kriterien zur Einstufung von Sicherheitsereignissen als Vorfälle definiert. Ein Triage-Prozess stellt sicher, dass gemeldete Ereignisse zeitnah bewertet und entsprechend eskaliert werden. Die Entscheidungslogik ist im Incident-Response-Plan dokumentiert.",
  },
  {
    code: "A.5.26",
    title: "Reaktion auf Informationssicherheitsvorfälle",
    description:
      "Auf Informationssicherheitsvorfälle sollte gemäß den dokumentierten Verfahren reagiert werden.",
    justification:
      "Die [Firmenname eintragen] folgt bei der Reaktion auf Sicherheitsvorfälle einem dokumentierten Prozess (Erkennung, Eindämmung, Beseitigung, Wiederherstellung, Nachbearbeitung). Vorfälle werden im Vorfallsregister dokumentiert und relevante Behörden sowie betroffene Parteien werden gemäß gesetzlichen Anforderungen benachrichtigt.",
  },
  {
    code: "A.5.27",
    title: "Erkenntnisse aus Informationssicherheitsvorfällen",
    description:
      "Aus Informationssicherheitsvorfällen gewonnene Erkenntnisse sollten genutzt werden, um die Stärke und Verbesserung der Maßnahmen zu erhöhen.",
    justification:
      "Die [Firmenname eintragen] führt nach jedem wesentlichen Sicherheitsvorfall eine Post-Mortem-Analyse durch. Lessons Learned werden dokumentiert und fließen in die Verbesserung von Kontrollen, Prozessen und Schulungsmaßnahmen ein. Erkenntnisse werden im nächsten Management-Review vorgestellt.",
  },
  {
    code: "A.5.28",
    title: "Sammeln von Beweismaterial",
    description:
      "Die Organisation sollte Verfahren für die Identifizierung, Erhebung, Beschaffung und Aufbewahrung von Beweismitteln im Zusammenhang mit Informationssicherheitsereignissen festlegen und anwenden.",
    justification:
      "Die [Firmenname eintragen] hat Verfahren zur forensisch sicheren Beweissicherung implementiert. Logs und Beweismittel werden gesichert und unter Wahrung der Beweiskette aufbewahrt. Bei schwerwiegenden Vorfällen wird ggf. ein spezialisierter Forensik-Dienstleister einbezogen.",
  },
  {
    code: "A.5.29",
    title: "Informationssicherheit bei Störungen",
    description:
      "Die Organisation sollte planen, wie die Informationssicherheit auf einem geeigneten Niveau bei Unterbrechungen aufrechterhalten werden kann.",
    justification:
      "Die [Firmenname eintragen] hat Notfallpläne entwickelt, die auch Sicherheitsaspekte bei Betriebsunterbrechungen berücksichtigen. Der Business-Continuity-Plan enthält Anweisungen zur Aufrechterhaltung von Sicherheitsmaßnahmen in Ausnahmesituationen und wird regelmäßig geübt.",
  },
  {
    code: "A.5.30",
    title: "IKT-Bereitschaft für Business Continuity",
    description:
      "Die IKT-Bereitschaft sollte auf der Grundlage von Business-Continuity-Zielen und IKT-Kontinuitätsanforderungen geplant, umgesetzt, aufrechterhalten und getestet werden.",
    justification:
      "Die [Firmenname eintragen] hat IKT-Kontinuitätspläne entwickelt, die Recovery-Time-Objectives (RTO) und Recovery-Point-Objectives (RPO) für kritische Systeme definieren. Backup- und Wiederherstellungsverfahren werden regelmäßig getestet und die Ergebnisse dokumentiert.",
  },
  {
    code: "A.5.31",
    title:
      "Rechtliche, gesetzliche, regulatorische und vertragliche Anforderungen",
    description:
      "Rechtliche, gesetzliche, regulatorische und vertragliche Anforderungen, die für die Informationssicherheit relevant sind, sowie der Ansatz der Organisation zur Erfüllung dieser Anforderungen sollten identifiziert, dokumentiert und aktuell gehalten werden.",
    justification:
      "Die [Firmenname eintragen] hat alle relevanten gesetzlichen, regulatorischen und vertraglichen Anforderungen identifiziert und dokumentiert (z. B. DSGVO, KRITIS-Anforderungen, branchenspezifische Regulierung). Ein Compliance-Register wird geführt und regelmäßig auf Aktualität geprüft.",
  },
  {
    code: "A.5.32",
    title: "Geistige Eigentumsrechte",
    description:
      "Die Organisation sollte Verfahren umsetzen, um die Rechte des geistigen Eigentums zu schützen.",
    justification:
      "Die [Firmenname eintragen] hat Richtlinien zum Schutz geistiger Eigentumsrechte implementiert. Die Nutzung von Software wird über ein Lizenzmanagement-System überwacht. Mitarbeiter werden über Urheberrechte und die korrekte Nutzung von Drittanbietersoftware und -materialien geschult.",
  },
  {
    code: "A.5.33",
    title: "Schutz von Aufzeichnungen",
    description:
      "Aufzeichnungen sollten vor Verlust, Zerstörung, Fälschung, unbefugtem Zugriff und Freigabe geschützt werden.",
    justification:
      "Die [Firmenname eintragen] hat ein Aufbewahrungskonzept definiert, das gesetzliche Aufbewahrungsfristen berücksichtigt. Aufzeichnungen werden vor unbefugtem Zugriff, Verlust und Manipulation geschützt. Löschfristen sind definiert und werden automatisiert überwacht.",
  },
  {
    code: "A.5.34",
    title: "Privatsphäre und Schutz von personenbezogenen Daten",
    description:
      "Die Organisation sollte die Anforderungen im Zusammenhang mit dem Schutz der Privatsphäre und des Schutzes personenbezogener Daten gemäß den geltenden Gesetzen und Vorschriften identifizieren und erfüllen.",
    justification:
      "Die [Firmenname eintragen] hat Datenschutzmaßnahmen entsprechend der DSGVO implementiert. Ein Datenschutzbeauftragter ist benannt. Verarbeitungsverzeichnisse werden geführt, Datenschutz-Folgenabschätzungen werden bei Bedarf durchgeführt und Mitarbeiter werden regelmäßig in Datenschutzthemen geschult.",
  },
  {
    code: "A.5.35",
    title: "Unabhängige Überprüfung der Informationssicherheit",
    description:
      "Der Ansatz der Organisation zur Verwaltung der Informationssicherheit und deren Umsetzung einschließlich Menschen, Prozessen und Technologien sollte in geplanten Abständen oder wenn wesentliche Änderungen auftreten unabhängig überprüft werden.",
    justification:
      "Die [Firmenname eintragen] lässt das ISMS regelmäßig durch interne Audits und externe Gutachter (mindestens jährlich) überprüfen. Die Ergebnisse werden der Geschäftsführung berichtet und Verbesserungsmaßnahmen werden im Rahmen des kontinuierlichen Verbesserungsprozesses umgesetzt.",
  },
  {
    code: "A.5.36",
    title:
      "Einhaltung von Richtlinien, Vorschriften und Normen für Informationssicherheit",
    description:
      "Die Einhaltung der Informationssicherheitsrichtlinie, der themenspezifischen Richtlinien, der Vorschriften und der Normen der Organisation sollte regelmäßig überprüft werden.",
    justification:
      "Die [Firmenname eintragen] führt regelmäßige Compliance-Checks und interne Audits durch, um die Einhaltung der ISMS-Richtlinien und -Normen zu überprüfen. Abweichungen werden erfasst, bewertet und über den Korrekturmaßnahmenprozess behoben.",
  },
  {
    code: "A.5.37",
    title: "Dokumentierte Bedienabläufe",
    description:
      "Bedienabläufe für informationsverarbeitende Einrichtungen sollten dokumentiert und allen Mitarbeitern, die diese benötigen, zur Verfügung gestellt werden.",
    justification:
      "Die [Firmenname eintragen] dokumentiert alle relevanten Betriebsprozeduren und stellt diese im internen Wiki bzw. Dokumentenmanagementsystem bereit. Betriebshandbücher, Notfallprozeduren und Wartungsanleitungen werden regelmäßig aktualisiert und Mitarbeitern zugänglich gemacht.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // A.6 Personenbezogene Maßnahmen (8 controls)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    code: "A.6.1",
    title: "Sicherheitsüberprüfung",
    description:
      "Überprüfungen des Hintergrunds aller Kandidaten für eine Beschäftigung sollten vor dem Eintritt in die Organisation und danach regelmäßig, unter Berücksichtigung der geltenden Gesetze, Vorschriften und ethischen Gesichtspunkte und proportional zu den Geschäftsanforderungen, der Klassifizierung der Informationen, auf die zugegriffen werden soll, und den wahrgenommenen Risiken, durchgeführt werden.",
    justification:
      "Die [Firmenname eintragen] führt vor Einstellung neuer Mitarbeiter Hintergrundüberprüfungen durch, die den gesetzlichen Anforderungen entsprechen. Der Umfang der Überprüfung richtet sich nach der Sensibilität der Position und wird im Einstellungsprozess dokumentiert.",
  },
  {
    code: "A.6.2",
    title: "Beschäftigungs- und Vertragsbedingungen",
    description:
      "Die Beschäftigungsverträge sollten die Verantwortlichkeiten der Mitarbeiter und der Organisation in Bezug auf die Informationssicherheit angeben.",
    justification:
      "Alle Arbeitsverträge der [Firmenname eintragen] enthalten Klauseln zur Informationssicherheit, Verschwiegenheitspflichten und Datenschutz. Mitarbeiter bestätigen schriftlich, die Informationssicherheitsrichtlinien gelesen und verstanden zu haben.",
  },
  {
    code: "A.6.3",
    title:
      "Informationssicherheitsbewusstsein, -ausbildung und -schulung",
    description:
      "Das Personal der Organisation und gegebenenfalls relevante interessierte Parteien sollten in Bezug auf ihre berufliche Funktion ein angemessenes Bewusstsein für Informationssicherheit erhalten, und regelmäßig geschult werden.",
    justification:
      "Die [Firmenname eintragen] führt ein jährliches Pflichtschulungsprogramm zur Informationssicherheit für alle Mitarbeiter durch. Neue Mitarbeiter erhalten im Onboarding eine Grundlageschulung. Rollenspezifische Vertiefungsschulungen werden für IT- und Sicherheitspersonal angeboten. Die Teilnahme wird dokumentiert.",
  },
  {
    code: "A.6.4",
    title: "Maßregelungsprozess",
    description:
      "Es sollte ein formeller und kommunizierter Maßregelungsprozess eingerichtet werden, um Maßnahmen gegen Mitarbeiter zu ergreifen, die gegen die Informationssicherheitsrichtlinie verstoßen haben.",
    justification:
      "Die [Firmenname eintragen] hat einen Disziplinarprozess für Verstöße gegen die Informationssicherheitsrichtlinien etabliert. Der Prozess ist in der Personalrichtlinie dokumentiert, verhältnismäßig und berücksichtigt rechtliche Anforderungen. Mitarbeiter werden über mögliche Konsequenzen bei Einstellung informiert.",
  },
  {
    code: "A.6.5",
    title:
      "Verantwortlichkeit nach Beendigung oder Änderung der Beschäftigung",
    description:
      "Die Verantwortlichkeiten und Pflichten im Bereich der Informationssicherheit, die nach Beendigung oder Änderung der Beschäftigung in Kraft bleiben, sollten definiert, dem Mitarbeiter oder Auftragnehmer mitgeteilt und durchgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] stellt sicher, dass Geheimhaltungsverpflichtungen auch nach Beendigung des Arbeitsverhältnisses weiter gelten. Dies ist vertraglich geregelt und wird beim Offboarding nochmals kommuniziert. Alle Zugriffsrechte werden bei Ausscheiden sofort gesperrt.",
  },
  {
    code: "A.6.6",
    title: "Vertraulichkeits- oder Geheimhaltungsvereinbarungen",
    description:
      "Geheimhaltungsvereinbarungen oder Vertraulichkeitsvereinbarungen, die die Anforderungen der Organisation an den Schutz von Informationen widerspiegeln, sollten identifiziert, dokumentiert, regelmäßig überprüft und von Mitarbeitern und anderen relevanten interessierten Parteien unterzeichnet werden.",
    justification:
      "Die [Firmenname eintragen] lässt alle Mitarbeiter, Auftragnehmer und relevante Dritte Geheimhaltungsvereinbarungen unterzeichnen. Die NDAs werden regelmäßig auf Aktualität überprüft. Unterzeichnete Vereinbarungen werden in der Personalakte dokumentiert.",
  },
  {
    code: "A.6.7",
    title: "Telearbeit",
    description:
      "Es sollten Sicherheitsmaßnahmen umgesetzt werden, wenn Mitarbeiter remote arbeiten, um Informationen zu schützen, auf die zugegriffen wird, die verarbeitet oder gespeichert werden außerhalb der Räumlichkeiten der Organisation.",
    justification:
      "Die [Firmenname eintragen] hat eine Telearbeitsrichtlinie etabliert, die Anforderungen an die Heimarbeitsumgebung, die Nutzung von VPN, die Gerätesicherheit und den Schutz vertraulicher Informationen regelt. Mitarbeiter werden in den Anforderungen für sicheres Remote-Working geschult.",
  },
  {
    code: "A.6.8",
    title: "Meldung von Informationssicherheitsereignissen",
    description:
      "Die Organisation sollte einen Mechanismus bereitstellen, über den Mitarbeiter durch die entsprechenden Kanäle beobachtete oder vermutete Informationssicherheitsereignisse zeitgerecht melden können.",
    justification:
      "Die [Firmenname eintragen] hat einen klar definierten Meldeprozess für Sicherheitsvorfälle implementiert. Mitarbeiter können Vorfälle über ein Ticketsystem, eine dedizierte E-Mail-Adresse oder direkt an den ISB melden. Der Meldeprozess wird im Rahmen der Sicherheitsschulungen regelmäßig kommuniziert.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // A.7 Physische Maßnahmen (14 controls)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    code: "A.7.1",
    title: "Physische Sicherheitsperimeter",
    description:
      "Sicherheitsperimeter sollten definiert und zum Schutz der Bereiche, die Informationen und andere damit verbundene Werte enthalten, verwendet werden.",
    justification:
      "Die [Firmenname eintragen] hat physische Sicherheitsbereiche definiert und durch geeignete Maßnahmen gesichert. Büros und Serverräume sind durch Schlösser, Zutrittskontrollsysteme und Alarmanlagen geschützt. Zutrittsberechtigungen werden verwaltet und regelmäßig überprüft.",
  },
  {
    code: "A.7.2",
    title: "Physischer Zutritt",
    description:
      "Sicherheitsbereiche sollten durch angemessene Zutrittskontrolle und Zugangspunkte geschützt werden, um sicherzustellen, dass nur autorisiertes Personal Zutritt hat.",
    justification:
      "Die [Firmenname eintragen] setzt Zutrittskontrollsysteme (Chipkarten, PIN-Codes) für sicherheitsrelevante Bereiche ein. Besucher werden registriert, begleitet und Zutrittsrechte werden regelmäßig überprüft. Serverräume haben eine zusätzliche Sicherheitsschicht mit eingeschränktem Zutritt.",
  },
  {
    code: "A.7.3",
    title: "Sichern von Büros, Räumen und Einrichtungen",
    description:
      "Für Büros, Räume und Einrichtungen sollte physische Sicherheit entworfen und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] hat physische Sicherheitsmaßnahmen für alle Büroräume und Einrichtungen implementiert. Sensible Bereiche sind besonders gesichert. Fenster und Türen werden außerhalb der Arbeitszeiten verschlossen und ein Wachdienst oder eine Alarmanlage ist vorhanden.",
  },
  {
    code: "A.7.4",
    title: "Physische Sicherheitsüberwachung",
    description:
      "Die Räumlichkeiten sollten kontinuierlich auf unbefugten physischen Zugang überwacht werden.",
    justification:
      "Die [Firmenname eintragen] überwacht sicherheitsrelevante Bereiche durch Videoüberwachung (CCTV) und/oder Bewegungsmelder. Die Aufzeichnungen werden entsprechend den gesetzlichen Anforderungen aufbewahrt. Datenschutzrechtliche Anforderungen bei der Überwachung werden eingehalten.",
  },
  {
    code: "A.7.5",
    title: "Schutz vor physischen und umweltbedingten Bedrohungen",
    description:
      "Schutz vor physischen und umweltbedingten Bedrohungen wie Naturkatastrophen und anderen absichtlichen oder unabsichtlichen physischen Bedrohungen für die Infrastruktur sollte entworfen und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] hat Maßnahmen gegen physische und umweltbedingte Risiken implementiert. Serverräume sind mit Brandmeldeanlagen, unterbrechungsfreier Stromversorgung (USV) und Klimatisierung ausgestattet. Risiken durch Überschwemmung, Brand und andere Umwelteinflüsse wurden bewertet und adressiert.",
  },
  {
    code: "A.7.6",
    title: "Arbeiten in Sicherheitsbereichen",
    description:
      "Für das Arbeiten in Sicherheitsbereichen sollten Sicherheitsmaßnahmen entworfen und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] hat Verhaltensregeln für das Arbeiten in Sicherheitsbereichen definiert. Mitarbeiter mit Zutritt zu sensiblen Bereichen sind in den geltenden Regeln geschult. Die Mitnahme privater Endgeräte in bestimmte Bereiche ist geregelt.",
  },
  {
    code: "A.7.7",
    title: "Aufgeräumte Arbeitsumgebung und Bildschirmsperren",
    description:
      "Es sollten Clear-Desk-Regeln für Unterlagen und Wechseldatenträger und Clear-Screen-Regeln für informationsverarbeitende Einrichtungen definiert und angemessen durchgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] hat eine Clear-Desk- und Clear-Screen-Richtlinie eingeführt. Mitarbeiter sind verpflichtet, Arbeitsflächen am Ende des Arbeitstages aufzuräumen und Bildschirmsperren bei Abwesenheit zu aktivieren. Die Richtlinie wird regelmäßig kommuniziert und überprüft.",
  },
  {
    code: "A.7.8",
    title: "Platzierung und Schutz von Geräten und Betriebsmitteln",
    description:
      "Geräte und Betriebsmittel sollten sicher platziert und geschützt werden.",
    justification:
      "Die [Firmenname eintragen] platziert IT-Geräte und Betriebsmittel so, dass unbefugter Zugang und Einsichtnahme verhindert wird. Serverräume sind physisch gesichert und nur autorisiertem Personal zugänglich. Geräte in öffentlich zugänglichen Bereichen sind besonders geschützt.",
  },
  {
    code: "A.7.9",
    title: "Sicherheit von Werten außerhalb der Räumlichkeiten",
    description:
      "Werte außerhalb der Räumlichkeiten sollten geschützt werden.",
    justification:
      "Die [Firmenname eintragen] hat Regeln für den sicheren Umgang mit Unternehmensgeräten außerhalb der Räumlichkeiten definiert. Laptops und mobile Geräte müssen verschlüsselt sein. Mitarbeiter sind verpflichtet, Geräte nicht unbeaufsichtigt zu lassen und bei Verlust sofort zu melden.",
  },
  {
    code: "A.7.10",
    title: "Speichermedien",
    description:
      "Speichermedien sollten entsprechend dem Klassifizierungsschema der Organisation über ihren gesamten Lebenszyklus, Beschaffung, Nutzung, Transport und Entsorgung, verwaltet werden.",
    justification:
      "Die [Firmenname eintragen] verwaltet Speichermedien über ihren gesamten Lebenszyklus. Wechseldatenträger werden registriert und bei Bedarf verschlüsselt. Vor Weitergabe oder Entsorgung werden Medien sicher gelöscht oder physisch vernichtet. Der Prozess ist dokumentiert.",
  },
  {
    code: "A.7.11",
    title: "Versorgungseinrichtungen",
    description:
      "Informationsverarbeitende Einrichtungen sollten vor Stromausfällen und anderen Störungen geschützt werden, die durch einen Ausfall von Versorgungseinrichtungen verursacht werden.",
    justification:
      "Die [Firmenname eintragen] hat Maßnahmen zur Sicherstellung der Stromversorgung und anderer Versorgungseinrichtungen implementiert. Kritische Systeme sind an eine USV angeschlossen. Redundante Internetanbindungen sind vorhanden und werden regelmäßig getestet.",
  },
  {
    code: "A.7.12",
    title: "Sicherheit der Verkabelung",
    description:
      "Kabel, die Strom oder Telekommunikation übertragen oder Informations- und Kommunikationsdienste unterstützen, sollten vor Abhören, Störungen oder Beschädigung geschützt werden.",
    justification:
      "Die [Firmenname eintragen] schützt Netzwerk- und Stromkabel vor Beschädigung, Abhören und unbefugtem Zugriff. Kabel in Serverräumen und sensiblen Bereichen sind in Kabelkanälen oder unter Bodenplatten verlegt. Kabelführungspläne werden gepflegt.",
  },
  {
    code: "A.7.13",
    title: "Instandhalten von Geräten und Betriebsmitteln",
    description:
      "Geräte und Betriebsmittel sollten korrekt instandgehalten werden, um die Verfügbarkeit, Integrität und Vertraulichkeit von Informationen sicherzustellen.",
    justification:
      "Die [Firmenname eintragen] führt regelmäßige Wartungsmaßnahmen für IT-Geräte und Betriebsmittel durch. Wartungsarbeiten werden dokumentiert und nur autorisiertes Personal führt Instandhaltungsarbeiten durch. Bei externer Wartung werden Begleitmaßnahmen zum Schutz von Informationen ergriffen.",
  },
  {
    code: "A.7.14",
    title:
      "Sichere Entsorgung oder Wiederverwendung von Geräten und Betriebsmitteln",
    description:
      "Geräte und Betriebsmittel, die Speichermedien enthalten, sollten überprüft werden, um sicherzustellen, dass sensible Daten und lizenzierte Software vor der Entsorgung oder Wiederverwendung entfernt wurden.",
    justification:
      "Die [Firmenname eintragen] stellt sicher, dass alle Geräte vor der Entsorgung oder Weitergabe sicher gelöscht werden. Für besonders sensible Geräte wird eine zertifizierte Vernichtung durch einen zertifizierten Entsorgungsdienstleister durchgeführt. Entsorgungen werden dokumentiert.",
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // A.8 Technologische Maßnahmen (34 controls)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    code: "A.8.1",
    title: "Benutzerendgeräte",
    description:
      "Informationen, die auf Benutzerendgeräten gespeichert, verarbeitet oder über diese zugänglich sind, sollten geschützt werden.",
    justification:
      "Die [Firmenname eintragen] hat Richtlinien und technische Maßnahmen für den Schutz von Benutzerendgeräten implementiert. Alle dienstlichen Geräte sind verschlüsselt, mit Antivirensoftware ausgestattet und werden zentral verwaltet (MDM/UEM). Mitarbeiter sind in der sicheren Nutzung von Endgeräten geschult.",
  },
  {
    code: "A.8.2",
    title: "Privilegierte Zugangsrechte",
    description:
      "Die Zuweisung und Nutzung von privilegierten Zugangsrechten sollte eingeschränkt und verwaltet werden.",
    justification:
      "Die [Firmenname eintragen] verwaltet privilegierte Zugriffsrechte nach dem Prinzip der geringsten Rechte. Administratorrechte werden nur bei Bedarf vergeben, privilegierte Konten werden separat vom normalen Benutzerkonto geführt und privilegierte Aktionen werden protokolliert und überwacht.",
  },
  {
    code: "A.8.3",
    title: "Einschränkung des Zugangs zu Informationen",
    description:
      "Der Zugang zu Informationen und anderen damit verbundenen Werten sollte entsprechend der festgelegten themenspezifischen Zugangssteuerungsrichtlinie eingeschränkt werden.",
    justification:
      "Die [Firmenname eintragen] setzt Zugriffskontrollen auf Basis von Rollen und dem Need-to-know-Prinzip um. Zugriff auf sensible Informationen ist auf autorisierte Personen beschränkt. Zugriffsrechte werden regelmäßig überprüft und nicht mehr benötigte Rechte werden entzogen.",
  },
  {
    code: "A.8.4",
    title: "Zugang zum Quellcode",
    description:
      "Lese- und Schreibzugang zum Quellcode, Entwicklungswerkzeugen und Software-Bibliotheken sollte angemessen verwaltet werden.",
    justification:
      "Die [Firmenname eintragen] kontrolliert den Zugriff auf Quellcode-Repositories streng. Entwickler erhalten nur Zugriff auf die für ihre Aufgaben benötigten Repositories. Änderungen am Quellcode werden über ein Versionskontrollsystem (z. B. Git) nachverfolgt und Reviews sind vor dem Merge in Hauptbranches verpflichtend.",
  },
  {
    code: "A.8.5",
    title: "Sichere Authentifizierung",
    description:
      "Sichere Authentifizierungstechnologien und -verfahren sollten auf der Grundlage von Einschränkungen des Informationszugangs und der themenspezifischen Richtlinie zur Zugangssteuerung umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] setzt starke Authentifizierungsverfahren ein. Für kritische Systeme und Remote-Zugriff ist Multi-Faktor-Authentifizierung (MFA) verpflichtend. Single Sign-On (SSO) wird zentral verwaltet und Passwortrichtlinien werden technisch durchgesetzt.",
  },
  {
    code: "A.8.6",
    title: "Kapazitätsmanagement",
    description:
      "Die Nutzung von Ressourcen sollte überwacht und angepasst werden, und Projektionen für zukünftige Kapazitätsanforderungen sollten erstellt werden, um die erforderliche Systemperformance sicherzustellen.",
    justification:
      "Die [Firmenname eintragen] überwacht die Auslastung von Systemressourcen (CPU, Speicher, Netzwerk) kontinuierlich. Kapazitätsplanungen werden regelmäßig durchgeführt und Schwellenwerte für Warnmeldungen sind definiert. Kapazitätserweiterungen werden proaktiv geplant.",
  },
  {
    code: "A.8.7",
    title: "Schutz vor Schadsoftware",
    description:
      "Schutz gegen Schadsoftware sollte umgesetzt und durch angemessenes Bewusstsein der Benutzer unterstützt werden.",
    justification:
      "Die [Firmenname eintragen] hat Schutzmaßnahmen gegen Schadsoftware auf allen Endgeräten und Servern implementiert. Antivirensoftware wird zentral verwaltet und regelmäßig aktualisiert. E-Mail-Filter und Web-Proxies blockieren bekannte Schadcodes. Mitarbeiter werden regelmäßig zu Phishing und Malware-Risiken geschult.",
  },
  {
    code: "A.8.8",
    title: "Handhabung technischer Sicherheitslücken",
    description:
      "Informationen über technische Sicherheitslücken der verwendeten Informationssysteme sollten zeitgerecht eingeholt werden; die Anfälligkeit der Organisation für diese Sicherheitslücken sollte bewertet werden und es sollten geeignete Maßnahmen ergriffen werden.",
    justification:
      "Die [Firmenname eintragen] hat einen Vulnerability-Management-Prozess etabliert. Schwachstellen werden durch regelmäßige Scans identifiziert und nach Kritikalität priorisiert. Patches werden nach definierten Fristen eingespielt (kritisch: innerhalb von 24-72 Stunden). Der Prozess ist dokumentiert und wird regelmäßig überprüft.",
  },
  {
    code: "A.8.9",
    title: "Konfigurationsmanagement",
    description:
      "Konfigurationen, einschließlich Sicherheitskonfigurationen, von Hardware, Software, Diensten und Netzwerken sollten festgelegt, dokumentiert, umgesetzt, überwacht und überprüft werden.",
    justification:
      "Die [Firmenname eintragen] hat Baseline-Konfigurationen (Hardening-Standards) für alle Systemtypen definiert. Konfigurationen werden in einem CMDB erfasst, Abweichungen von den Baselines werden automatisch erkannt und Änderungen werden über den Änderungsmanagementprozess gesteuert.",
  },
  {
    code: "A.8.10",
    title: "Löschung von Informationen",
    description:
      "In Informationssystemen, Geräten oder anderen Speichermedien gespeicherte Informationen sollten gelöscht werden, wenn sie nicht mehr benötigt werden.",
    justification:
      "Die [Firmenname eintragen] hat Löschprozesse und -fristen für Informationen definiert, die gesetzliche Aufbewahrungsfristen berücksichtigen. Daten werden nach Ablauf der Aufbewahrungsfrist sicher und nachvollziehbar gelöscht. Der Löschprozess wird dokumentiert.",
  },
  {
    code: "A.8.11",
    title: "Datenmaskierung",
    description:
      "Datenmaskierung sollte entsprechend der themenspezifischen Richtlinie der Organisation zur Zugangssteuerung und anderen damit verbundenen themenspezifischen Richtlinien sowie den Geschäftsanforderungen unter Berücksichtigung der geltenden Rechtsvorschriften eingesetzt werden.",
    justification:
      "Die [Firmenname eintragen] setzt Datenmaskierung und Pseudonymisierung ein, wo personenbezogene oder sensible Daten zu Entwicklungs-, Test- oder Analysezwecken verwendet werden. Produktionsdaten werden in Nicht-Produktionsumgebungen maskiert.",
  },
  {
    code: "A.8.12",
    title: "Verhinderung von Datenlecks",
    description:
      "Maßnahmen zur Verhinderung von Datenlecks sollten auf Systeme, Netzwerke und andere Geräte, die sensible Informationen verarbeiten, speichern oder übertragen, angewendet werden.",
    justification:
      "Die [Firmenname eintragen] hat Data-Loss-Prevention-Maßnahmen implementiert. DLP-Tools überwachen den Datenabfluss über E-Mail, Web und Wechseldatenträger. Sensible Daten werden klassifiziert und entsprechende Schutzmaßnahmen werden automatisch angewendet.",
  },
  {
    code: "A.8.13",
    title: "Sicherung von Informationen",
    description:
      "Sicherungskopien von Informationen, Software und Systemen sollten aufbewahrt und regelmäßig gemäß der vereinbarten themenspezifischen Richtlinie für Sicherungen getestet werden.",
    justification:
      "Die [Firmenname eintragen] führt regelmäßige Backups aller kritischen Daten und Systeme durch. Backups werden verschlüsselt und an einem gesicherten, vom Primärstandort getrennten Ort aufbewahrt. Wiederherstellungstests werden quartalsweise durchgeführt und dokumentiert.",
  },
  {
    code: "A.8.14",
    title: "Redundanz von informationsverarbeitenden Einrichtungen",
    description:
      "Informationsverarbeitende Einrichtungen sollten mit ausreichend Redundanz implementiert sein, um die Verfügbarkeitsanforderungen zu erfüllen.",
    justification:
      "Die [Firmenname eintragen] hat Redundanzmaßnahmen für kritische Systeme und Infrastrukturkomponenten implementiert. Hochverfügbarkeits-Cluster, redundante Netzwerkverbindungen und redundante Stromversorgung sind für kritische Systeme vorhanden. Verfügbarkeitsziele sind definiert und werden regelmäßig überprüft.",
  },
  {
    code: "A.8.15",
    title: "Protokollierung",
    description:
      "Protokolle, die Aktivitäten, Ausnahmen, Fehler und andere relevante Ereignisse aufzeichnen, sollten erstellt, gespeichert, geschützt und analysiert werden.",
    justification:
      "Die [Firmenname eintragen] hat eine zentrale Log-Management-Infrastruktur implementiert. Sicherheitsrelevante Ereignisse aller Systeme werden zentral gesammelt, gespeichert und regelmäßig analysiert. Aufbewahrungsfristen für Logs sind definiert und Logs sind vor Manipulation geschützt.",
  },
  {
    code: "A.8.16",
    title: "Überwachungsaktivitäten",
    description:
      "Netzwerke, Systeme und Anwendungen sollten auf anomales Verhalten überwacht werden und es sollten geeignete Maßnahmen ergriffen werden, um potenzielle Informationssicherheitsvorfälle zu bewerten.",
    justification:
      "Die [Firmenname eintragen] setzt Monitoring-Tools ein, um Netzwerk- und Systemaktivitäten kontinuierlich zu überwachen. Ein SIEM-System korreliert Ereignisse und generiert Warnmeldungen bei verdächtigen Aktivitäten. Alarme werden von geschultem Personal bewertet und eskaliert.",
  },
  {
    code: "A.8.17",
    title: "Uhrensynchronisierung",
    description:
      "Die Uhren von informationsverarbeitenden Systemen, die von der Organisation oder den Sicherheitsanbietern verwendet werden, sollten mit genehmigten Zeitquellen synchronisiert werden.",
    justification:
      "Die [Firmenname eintragen] synchronisiert alle Systemuhren mit zuverlässigen NTP-Zeitservern. Eine konsistente Zeitbasis ist für die Korrelation von Log-Ereignissen und forensische Analysen unerlässlich. Die NTP-Konfiguration wird regelmäßig überprüft.",
  },
  {
    code: "A.8.18",
    title: "Verwendung von privilegierten Hilfsprogrammen",
    description:
      "Die Nutzung von Hilfsprogrammen, die Informationssysteme und -anwendungsüberwachungsfunktionen übersteuern könnten, sollte eingeschränkt und streng kontrolliert werden.",
    justification: "[Kundenindividuell ausfüllen]",
  },
  {
    code: "A.8.19",
    title: "Installation von Software auf Betriebssystemen",
    description:
      "Verfahren und Maßnahmen sollten umgesetzt werden, um die Installation von Software auf Betriebssystemen sicher zu verwalten.",
    justification:
      "Die [Firmenname eintragen] hat einen kontrollierten Software-Installations-Prozess etabliert. Nur genehmigte Software darf auf Unternehmensgeräten installiert werden. Die Installation erfolgt über ein zentrales Software-Verteilsystem. Nicht autorisierte Software-Installation ist technisch eingeschränkt.",
  },
  {
    code: "A.8.20",
    title: "Netzwerksicherheit",
    description:
      "Netzwerke und Netzwerkgeräte sollten gesichert, verwaltet und kontrolliert werden, um Informationen in Systemen und Anwendungen zu schützen.",
    justification:
      "Die [Firmenname eintragen] hat Netzwerksicherheitsmaßnahmen implementiert. Firewalls, Intrusion-Detection-Systeme und Netzwerksegmentierung schützen die Infrastruktur. Netzwerkzugriffe werden protokolliert und Konfigurationen werden regelmäßig überprüft.",
  },
  {
    code: "A.8.21",
    title: "Sicherheit von Netzwerkdiensten",
    description:
      "Sicherheitsmechanismen, Dienstleistungsniveaus und Serviceanforderungen aller Netzwerkdienste sollten identifiziert, umgesetzt und überwacht werden.",
    justification:
      "Die [Firmenname eintragen] hat Sicherheitsanforderungen für alle genutzten Netzwerkdienste definiert. SLAs mit Netzwerkdienstleistern enthalten Sicherheitsanforderungen. Netzwerkdienste werden regelmäßig auf Einhaltung der Sicherheitsanforderungen überprüft.",
  },
  {
    code: "A.8.22",
    title: "Trennung von Netzwerken",
    description:
      "Gruppen von Informationsdiensten, Benutzern und Informationssystemen sollten in den Netzwerken der Organisation getrennt werden.",
    justification: "[Kundenindividuell ausfüllen]",
  },
  {
    code: "A.8.23",
    title: "Web-Filterung",
    description:
      "Der Zugang zu externen Webseiten sollte verwaltet werden, um die Exposition gegenüber böswilligen Inhalten zu reduzieren.",
    justification:
      "Die [Firmenname eintragen] setzt Web-Filterung ein, um den Zugang zu schädlichen oder richtlinienwidrigen Webseiten zu blockieren. Ein Web-Proxy mit URL-Filterung ist implementiert und die Filterregeln werden regelmäßig aktualisiert. Mitarbeiter werden über akzeptable Internetnutzung informiert.",
  },
  {
    code: "A.8.24",
    title: "Verwendung von Kryptographie",
    description:
      "Regeln für den wirksamen Einsatz von Kryptographie, einschließlich der Verwaltung kryptografischer Schlüssel, sollten festgelegt und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] hat eine Kryptographierichtlinie etabliert, die Verschlüsselungsstandards, Schlüsselverwaltung und akzeptable kryptographische Algorithmen definiert. Datenverschlüsselung ist für sensible Daten at-rest und in-transit verpflichtend. Schlüssel werden sicher verwaltet und rotiert.",
  },
  {
    code: "A.8.25",
    title: "Sicherer Entwicklungslebenszyklus",
    description:
      "Für die Entwicklung von Software und Systemen sollten Regeln festgelegt und angewendet werden.",
    justification:
      "Die [Firmenname eintragen] hat einen sicheren Software-Entwicklungslebenszyklus (Secure SDLC) implementiert. Sicherheitsanforderungen werden in der Anforderungsphase erfasst, Sicherheitsprinzipien werden im Design berücksichtigt und Sicherheitstests sind fester Bestandteil des Entwicklungsprozesses.",
  },
  {
    code: "A.8.26",
    title: "Anforderungen an die Anwendungssicherheit",
    description:
      "Anforderungen an die Informationssicherheit sollten bei der Entwicklung oder Beschaffung von Anwendungen identifiziert, spezifiziert und genehmigt werden.",
    justification:
      "Die [Firmenname eintragen] definiert Sicherheitsanforderungen bei der Entwicklung und Beschaffung von Anwendungen. Sicherheitsanforderungen sind Teil des Requirements-Engineering-Prozesses. Bei der Beschaffung werden Sicherheitsanforderungen in den Ausschreibungsunterlagen spezifiziert.",
  },
  {
    code: "A.8.27",
    title: "Sichere Systemarchitektur und technische Grundsätze",
    description:
      "Grundsätze für die Entwicklung sicherer Systeme sollten festgelegt, dokumentiert, gepflegt und auf jede Tätigkeit der Informationssystemsentwicklung angewendet werden.",
    justification:
      "Die [Firmenname eintragen] hat Sicherheitsarchitekturprinzipien (Security by Design, Defense in Depth, Zero Trust) definiert und in den Entwicklungsprozess integriert. Architektur-Reviews mit Fokus auf Sicherheit sind für wesentliche Systementwicklungen vorgesehen.",
  },
  {
    code: "A.8.28",
    title: "Sicheres Codieren",
    description:
      "Grundsätze des sicheren Codierens sollten auf die Software-Entwicklung angewendet werden.",
    justification:
      "Die [Firmenname eintragen] hat Richtlinien für sicheres Coden (Secure Coding Guidelines) eingeführt. Entwickler werden in sicheren Codierungstechniken geschult. Statische Code-Analysen (SAST) und Code-Reviews sind fester Bestandteil des Entwicklungsprozesses.",
  },
  {
    code: "A.8.29",
    title: "Sicherheitstests in Entwicklung und Abnahme",
    description:
      "Sicherheitstestprozesse sollten im Entwicklungslebenszyklus definiert und umgesetzt werden.",
    justification:
      "Die [Firmenname eintragen] führt Sicherheitstests als festen Bestandteil des Entwicklungs- und Abnahmeprozesses durch. Penetrationstests, DAST-Scans und Security-Reviews werden vor dem Go-live durchgeführt. Testergebnisse werden dokumentiert und gefundene Schwachstellen vor der Freigabe behoben.",
  },
  {
    code: "A.8.30",
    title: "Ausgelagerte Entwicklung",
    description:
      "Die Organisation sollte die Aktivitäten der ausgelagerten Systementwicklung lenken, überwachen und überprüfen.",
    justification:
      "Die [Firmenname eintragen] stellt sicher, dass bei ausgelagerter Softwareentwicklung die gleichen Sicherheitsstandards wie bei interner Entwicklung angewendet werden. Sicherheitsanforderungen sind vertraglich vereinbart, Codereviews durch interne Mitarbeiter sind vorgesehen und Sicherheitsüberprüfungen vor der Abnahme werden durchgeführt.",
  },
  {
    code: "A.8.31",
    title: "Trennung von Entwicklungs-, Test- und Produktionsumgebungen",
    description:
      "Entwicklungs-, Test- und Produktionsumgebungen sollten identifiziert und getrennt werden.",
    justification:
      "Die [Firmenname eintragen] betreibt strikt getrennte Entwicklungs-, Test- und Produktionsumgebungen. Produktionsdaten werden nicht in Entwicklungs- oder Testumgebungen verwendet (außer maskiert). Der Zugriff auf Produktionssysteme ist auf autorisiertes Personal beschränkt.",
  },
  {
    code: "A.8.32",
    title: "Änderungsmanagement",
    description:
      "Änderungen an informationsverarbeitenden Einrichtungen und Informationssystemen sollten Verfahren des Änderungsmanagements unterliegen.",
    justification:
      "Die [Firmenname eintragen] hat einen formellen Change-Management-Prozess implementiert. Alle Änderungen an Produktionssystemen werden beantragt, bewertet und genehmigt. Notfalländerungen folgen einem beschleunigten, aber kontrollierten Prozess. Änderungen werden dokumentiert und können zurückgerollt werden.",
  },
  {
    code: "A.8.33",
    title: "Testinformationen",
    description:
      "Testinformationen sollten angemessen ausgewählt, geschützt und verwaltet werden.",
    justification:
      "Die [Firmenname eintragen] stellt sicher, dass in Test- und Entwicklungsumgebungen keine echten personenbezogenen oder sensiblen Produktionsdaten verwendet werden. Testdaten werden generiert oder maskiert. Der Umgang mit Testdaten ist in der Entwicklungsrichtlinie geregelt.",
  },
  {
    code: "A.8.34",
    title: "Schutz von Informationssystemen bei Audit-Tests",
    description:
      "Audit-Tests und andere Sicherheitsbewertungsaktivitäten, die Betriebssysteme beinhalten, sollten geplant und zwischen dem Tester und der entsprechenden Leitung vereinbart werden.",
    justification:
      "Die [Firmenname eintragen] koordiniert Sicherheitsaudits und Penetrationstests sorgfältig, um Auswirkungen auf den Betrieb zu minimieren. Audit-Aktivitäten werden vorab genehmigt, zeitlich geplant und auf die notwendigen Systeme beschränkt. Ergebnisse werden vertraulich behandelt.",
  },
];

export async function POST() {
  try {
    let created = 0;
    let updated = 0;

    for (const control of controls) {
      const existing = await prisma.control.findFirst({
        where: { organizationId: (await getOrgId()), code: control.code },
      });

      if (existing) {
        await prisma.control.update({
          where: { id: existing.id },
          data: {
            title: control.title,
            description: control.description || existing.description,
            justification:
              existing.justification || control.justification || null,
          },
        });
        updated++;
      } else {
        await prisma.control.create({
          data: {
            id: `control-${control.code}`,
            organizationId: (await getOrgId()),
            code: control.code,
            title: control.title,
            isApplicable: true,
            description:
              control.description ||
              `ISO 27001:2022 Control ${control.code}`,
            justification: control.justification || null,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      total: controls.length,
    });
  } catch (error) {
    console.error("SOA sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unbekannter Fehler bei der SOA-Synchronisierung",
      },
      { status: 500 }
    );
  }
}

// Scenario: Datenleck & DSGVO-Meldung
// 8-Phasen-Simulation eines Datenschutzvorfalls mit DSGVO-Meldepflicht

interface GameScene {
  id: number;
  phase: string;
  title: string;
  narrative: string;
  alertLevel: "normal" | "warning" | "critical";
  interactiveObjects: string[];
  serverStatuses: Record<string, "healthy" | "warning" | "critical" | "offline">;
  objectTrigger: string;
  timeLimitSec: number | null;
  prompts: { question: string; placeholder: string; hint?: string }[];
  optimalActions: string[];
  keyTerms: string[];
  maxScore: number;
}

export const DATA_BREACH_SCENES: GameScene[] = [
  {
    id: 1,
    phase: "ERKENNUNG",
    title: "Ungewöhnlicher Datentransfer erkannt",
    narrative:
      "Es ist 06:42 Uhr. Das SIEM-System schlägt Alarm: In der vergangenen Nacht wurden 500 GB Daten aus der Kundendatenbank auf eine unbekannte externe IP-Adresse übertragen. Das DLP-System hat einen massiven Export-Vorgang aus srv-db protokolliert – gestartet um 01:15 Uhr, abgeschlossen um 04:47 Uhr. Die Uhr läuft. Wenn dies ein echter Datenschutzverstoß ist, beginnt die 72-Stunden-Frist nach Art. 33 DSGVO mit dem Moment der Kenntnisnahme. Sie sind der erste, der diesen Alert sieht. Was tun Sie jetzt?",
    alertLevel: "critical",
    interactiveObjects: ["srv-db", "srv-monitor", "monitor-main", "srv-firewall"],
    serverStatuses: {
      "srv-db": "critical",
      "srv-app": "warning",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "warning",
    },
    objectTrigger: "monitor-main",
    timeLimitSec: 240,
    prompts: [
      {
        question:
          "Das SIEM meldet einen Transfer von 500 GB aus srv-db zwischen 01:15 und 04:47 Uhr. Welche ersten Schritte leiten Sie ein und wen informieren Sie sofort?",
        placeholder:
          "Beschreiben Sie Ihre Sofortmaßnahmen: Eskalation, Dokumentation, erste Einschätzung...",
        hint: "Denken Sie an: Incident-Response-Team, DSB, Geschäftsführung – und dokumentieren Sie den Zeitpunkt der Kenntnisnahme.",
      },
      {
        question:
          "Was muss in der ersten Meldung an den Datenschutzbeauftragten enthalten sein, damit der 72-Stunden-Countdown korrekt gestartet wird?",
        placeholder:
          "Welche Informationen braucht der DSB unmittelbar: Zeitpunkt, Systeme, erste Schätzung der Betroffenheit...",
        hint: "Art. 33 DSGVO: Die Frist beginnt, sobald der Verantwortliche von dem Verstoß Kenntnis erlangt.",
      },
      {
        question:
          "Wie unterscheiden Sie in dieser frühen Phase zwischen einem echten Datenleck und einem False Positive des SIEM-Systems?",
        placeholder:
          "Welche Indikatoren weisen auf einen echten Vorfall hin, welche könnten auf ein False Positive deuten?",
        hint: "Prüfen Sie: Bekannte Backup-Jobs, autorisierte ETL-Prozesse, Ziel-IP-Reputation, Datenvolumen im Vergleich zu Baselines.",
      },
    ],
    optimalActions: [
      "Zeitpunkt der Kenntnisnahme exakt dokumentieren (Beginn der 72-Stunden-Frist)",
      "Datenschutzbeauftragten (DSB) sofort informieren",
      "CISO und Geschäftsführung eskalieren",
      "Incident-Response-Team aktivieren",
      "Firewall-Logs und SIEM-Rohdaten sichern ohne Systeme zu verändern",
    ],
    keyTerms: [
      "SIEM",
      "DLP",
      "Kenntnisnahme",
      "72-Stunden",
      "Datenschutzbeauftragter",
      "DSB",
      "Incident Response",
      "Eskalation",
      "Dokumentation",
      "Art. 33 DSGVO",
      "False Positive",
      "Firewall-Logs",
    ],
    maxScore: 10,
  },
  {
    id: 2,
    phase: "TRIAGE",
    title: "Klassifizierung des Vorfalls",
    narrative:
      "Das Incident-Response-Team ist versammelt. Die ersten Log-Analysen bestätigen: Es handelt sich nicht um einen autorisierten Prozess. Die Ziel-IP gehört zu einem VPS-Anbieter in Singapur. Ein erster Dump der betroffenen Datenbanktabellen zeigt Klartext-Kundendaten: Namen, Adressen, E-Mail-Adressen, Geburtsdaten, und – das ist der kritische Punkt – Gesundheitsdaten aus dem Patientenportal. Schätzungsweise 15.000 Datensätze. Die Uhr zeigt: 07:15 Uhr. Noch 68 Stunden und 45 Minuten bis zum DSGVO-Meldeschluss. Was ist die Kategorie dieses Vorfalls?",
    alertLevel: "critical",
    interactiveObjects: ["srv-db", "monitor-main", "monitor-email", "srv-monitor"],
    serverStatuses: {
      "srv-db": "critical",
      "srv-app": "warning",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "critical",
      "srv-firewall": "warning",
    },
    objectTrigger: "srv-db",
    timeLimitSec: 300,
    prompts: [
      {
        question:
          "Klassifizieren Sie den Vorfall nach DSGVO und EDPB-Leitlinien: Welche Schutzziele sind verletzt? Welche Datenkategorien sind betroffen?",
        placeholder:
          "Vertraulichkeit, Integrität, Verfügbarkeit – welche Datenkategorien nach Art. 9 DSGVO sind betroffen?",
        hint: "CIA-Triade: Hier ist primär die Vertraulichkeit verletzt. Gesundheitsdaten sind besondere Kategorien nach Art. 9 DSGVO.",
      },
      {
        question:
          "Wie bestimmen Sie die Anzahl der betroffenen Personen? Welche Methoden nutzen Sie für eine erste Schätzung?",
        placeholder:
          "Beschreiben Sie Ihre Methodik: Datenbankabfragen, Log-Analyse, betroffene Tabellen und Felder...",
        hint: "Zählen Sie DISTINCT Personen-IDs in den exfiltrierten Tabellen. Berücksichtigen Sie auch verknüpfte Datensätze.",
      },
    ],
    optimalActions: [
      "Verletzung der Vertraulichkeit als primäres Schutzziel dokumentieren",
      "Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO) identifizieren",
      "Anzahl betroffener Personen anhand der Datenbankstruktur schätzen",
      "Betroffene Datenkategorien vollständig katalogisieren",
      "Risikoeinstufung als 'hohes Risiko' aufgrund von Gesundheitsdaten vorläufig festlegen",
    ],
    keyTerms: [
      "Vertraulichkeit",
      "Art. 9 DSGVO",
      "besondere Kategorien",
      "Gesundheitsdaten",
      "personenbezogene Daten",
      "EDPB",
      "Schutzziel",
      "CIA",
      "15.000",
      "betroffene Personen",
      "Datenkategorien",
      "hohes Risiko",
    ],
    maxScore: 10,
  },
  {
    id: 3,
    phase: "EINDÄMMUNG",
    title: "Systeme isolieren und Beweise sichern",
    narrative:
      "08:30 Uhr. Sie müssen jetzt handeln – aber mit Bedacht. Jede unbedachte Aktion könnte forensische Beweise vernichten und die spätere Aufklärung unmöglich machen. Gleichzeitig läuft die Exfiltration möglicherweise noch. srv-db ist noch aktiv, der Angreifer könnte noch Zugriff haben. Der Firewall-Log zeigt: Die letzte Verbindung zur externen IP endete vor 47 Minuten. Dennoch: API-Keys, Service-Accounts, Admin-Credentials – alles könnte kompromittiert sein. Eindämmen, aber die Beweiskette wahren. Handeln Sie jetzt.",
    alertLevel: "critical",
    interactiveObjects: [
      "srv-db",
      "srv-firewall",
      "srv-app",
      "emergency-stop",
      "network-switch",
      "srv-backup",
    ],
    serverStatuses: {
      "srv-db": "critical",
      "srv-app": "warning",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "critical",
      "srv-firewall": "critical",
    },
    objectTrigger: "srv-firewall",
    timeLimitSec: 300,
    prompts: [
      {
        question:
          "Wie isolieren Sie srv-db, ohne forensische Beweise zu vernichten? Beschreiben Sie die Reihenfolge der Maßnahmen.",
        placeholder:
          "Netzwerksegmentierung, Memory-Dump, Snapshot vs. harter Neustart – was zuerst?",
        hint: "Grundsatz der forensischen Sicherung: Volatile Daten (RAM, aktive Verbindungen) zuerst sichern, dann Netzwerk trennen.",
      },
      {
        question:
          "Welche Zugangsdaten und API-Keys müssen sofort gesperrt oder rotiert werden? Wie priorisieren Sie?",
        placeholder:
          "Service-Accounts, API-Keys, Mitarbeiter-Credentials, OAuth-Tokens – welche zuerst?",
        hint: "Beginnen Sie mit den Credentials, die für den initialen Zugang genutzt wurden. Alle DB-Service-Accounts sind als kompromittiert zu betrachten.",
      },
      {
        question:
          "Welche Beweise müssen Sie sichern und wie dokumentieren Sie die Chain of Custody für ein späteres Strafverfahren?",
        placeholder:
          "Log-Dateien, Memory-Dumps, Netzwerk-Captures – was gehört zur Beweissicherung?",
        hint: "Chain of Custody: Wer hat was wann gesichert? Hash-Werte (SHA-256) der gesicherten Dateien für Integritätsnachweis.",
      },
    ],
    optimalActions: [
      "Memory-Dump und aktive Verbindungen von srv-db sichern bevor Isolation",
      "Netzwerksegmentierung via Firewall-Regel statt physischer Trennung",
      "Alle DB-Service-Accounts und API-Keys sofort sperren und rotieren",
      "Forensische Kopie (Bit-für-Bit-Image) der betroffenen Systeme erstellen",
      "Chain of Custody Dokumentation mit Hashwerten und Zeitstempeln beginnen",
    ],
    keyTerms: [
      "Forensik",
      "Chain of Custody",
      "Memory-Dump",
      "Netzwerksegmentierung",
      "API-Key",
      "Credential-Rotation",
      "SHA-256",
      "Hashwert",
      "Isolation",
      "Service-Account",
      "volatile Daten",
      "Beweissicherung",
      "Integritätsnachweis",
    ],
    maxScore: 10,
  },
  {
    id: 4,
    phase: "FORENSIK",
    title: "Angriffsverlauf rekonstruieren",
    narrative:
      "11:00 Uhr – noch 61 Stunden bis zur Meldepflicht. Das forensische Team hat die ersten Erkenntnisse: Ein Mitarbeiterkonto (m.fischer@unternehmen.de) wurde vor 9 Tagen durch eine Phishing-E-Mail kompromittiert. Der Angreifer hat sich von diesem Konto ausgehend lateral durch das Netzwerk bewegt, Rechte eskaliert und schließlich einen privilegierten DB-Account übernommen. Die Exfiltration erfolgte über ein Python-Skript, das per SFTP auf einen externen Server in Singapur übertrug. Die komplette Timeline liegt auf dem Tisch. Was bedeutet das für Ihre DSGVO-Meldung?",
    alertLevel: "critical",
    interactiveObjects: [
      "srv-db",
      "srv-app",
      "srv-mail",
      "monitor-main",
      "monitor-email",
      "srv-monitor",
    ],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "critical",
      "srv-web": "healthy",
      "srv-mail": "warning",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "critical",
    },
    objectTrigger: "monitor-email",
    timeLimitSec: 360,
    prompts: [
      {
        question:
          "Rekonstruieren Sie die Angriffskette (Kill Chain). Beschreiben Sie jeden Schritt vom initialen Phishing bis zur Exfiltration.",
        placeholder:
          "Initial Access → Persistence → Privilege Escalation → Lateral Movement → Exfiltration...",
        hint: "Nutzen Sie das MITRE ATT&CK Framework als Referenz für die Phasenbeschreibung der Angriffskette.",
      },
      {
        question:
          "Seit wann hatte der Angreifer möglicherweise Zugriff auf die Gesundheitsdaten? Wie beeinflusst das die DSGVO-Meldung?",
        placeholder:
          "Ermitteln Sie den frühestmöglichen Zeitpunkt des Datenzugriffs und die Konsequenzen für Art. 33 DSGVO...",
        hint: "Das Datum des Phishing-Vorfalls vor 9 Tagen ist kritisch: Potenziell hatte der Angreifer 9 Tage lang Zugriff auf sensible Daten.",
      },
    ],
    optimalActions: [
      "Vollständige Angriffstimeline von Phishing bis Exfiltration erstellen",
      "Kompromittiertes Mitarbeiterkonto und alle Sessions seit Kompromittierung analysieren",
      "Lateral Movement und Privilege Escalation im Active Directory nachverfolgen",
      "Exfiltrierte Datenmengen und betroffene Tabellen genau quantifizieren",
      "MITRE ATT&CK Mapping für Behörden-Meldung vorbereiten",
    ],
    keyTerms: [
      "Phishing",
      "Lateral Movement",
      "Privilege Escalation",
      "Kill Chain",
      "MITRE ATT&CK",
      "Exfiltration",
      "kompromittiertes Konto",
      "Timeline",
      "Active Directory",
      "SFTP",
      "Initial Access",
      "forensische Analyse",
    ],
    maxScore: 10,
  },
  {
    id: 5,
    phase: "RISIKOBEWERTUNG",
    title: "Risiko für betroffene Personen bewerten",
    narrative:
      "14:00 Uhr – noch 55 Stunden. Der DSB und die Rechtsabteilung sind im Krisenmodus. Jetzt kommt die entscheidende Frage: Wie hoch ist das Risiko für die 15.000 betroffenen Personen? Die EDPB-Leitlinien 9/2022 beschreiben die Methodik – aber die Fakten sind beunruhigend: Gesundheitsdaten im Klartext, Adressdaten, die Identitätsdiebstahl ermöglichen, und die Daten befinden sich auf einem Server in Singapur – außerhalb der EU. Das ist nicht nur ein hohes Risiko. Das könnte ein 'voraussichtlich hohes Risiko' nach Art. 34 DSGVO sein, das eine direkte Benachrichtigung der Betroffenen erfordert. Ihre Einschätzung entscheidet.",
    alertLevel: "critical",
    interactiveObjects: ["monitor-main", "srv-monitor", "monitor-phone"],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "warning",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "healthy",
    },
    objectTrigger: "monitor-main",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Bewerten Sie das Risiko für die betroffenen Personen nach EDPB-Leitlinien. Welche Faktoren erhöhen das Risiko auf 'voraussichtlich hohes Risiko'?",
        placeholder:
          "Schweregrad, Wahrscheinlichkeit des Schadens, besondere Datenkategorien, Anzahl Betroffene, Drittlandtransfer...",
        hint: "EDPB Guidelines 9/2022: Gesundheitsdaten + Klartextdaten + Identifikationsmerkmale + Drittlandtransfer = hohes Risiko.",
      },
      {
        question:
          "Welche konkreten Schäden drohen den betroffenen Personen und wie wahrscheinlich sind diese?",
        placeholder:
          "Identitätsdiebstahl, Diskriminierung aufgrund Gesundheitsdaten, finanzieller Schaden, Erpressung...",
        hint: "Bei Gesundheitsdaten: Diskriminierung (Versicherung, Arbeitgeber), Erpressung, emotionaler Schaden. Bei Adressdaten: Identitätsdiebstahl, Phishing.",
      },
      {
        question:
          "Kommt Art. 34 DSGVO (direkte Benachrichtigung der Betroffenen) zur Anwendung? Begründen Sie Ihre Entscheidung.",
        placeholder:
          "Schwellenwert 'voraussichtlich hohes Risiko' – erfüllt oder nicht? Welche Ausnahmen nach Art. 34 Abs. 3 greifen?",
        hint: "Art. 34 Abs. 3 DSGVO: Ausnahmen nur wenn Daten verschlüsselt waren oder Risiko nachträglich beseitigt wurde – beides trifft hier nicht zu.",
      },
    ],
    optimalActions: [
      "Risikobewertung nach EDPB-Leitlinien 9/2022 durchführen",
      "Schweregrad anhand Datenkategorien (Art. 9 DSGVO) als 'kritisch' einstufen",
      "Drittlandtransfer (Singapur) als zusätzlichen Risikofaktor dokumentieren",
      "Art. 34 DSGVO-Benachrichtigungspflicht als gegeben feststellen",
      "Risikomatrix mit Wahrscheinlichkeit und Schadensausmaß dokumentieren",
    ],
    keyTerms: [
      "EDPB",
      "Leitlinien 9/2022",
      "voraussichtlich hohes Risiko",
      "Art. 34 DSGVO",
      "Identitätsdiebstahl",
      "Diskriminierung",
      "Drittlandtransfer",
      "Schadenswahrscheinlichkeit",
      "Gesundheitsdaten",
      "Risikobewertung",
      "Schweregrad",
      "Benachrichtigungspflicht",
    ],
    maxScore: 10,
  },
  {
    id: 6,
    phase: "72-STUNDEN-MELDUNG",
    title: "Meldung an die Aufsichtsbehörde – Art. 33 DSGVO",
    narrative:
      "Montag, 08:42 Uhr – noch 22 Stunden und 18 Minuten. Die 72-Stunden-Frist läuft ab Dienstag 06:42 Uhr. Die Meldung muss an die zuständige Datenschutz-Aufsichtsbehörde gehen – in Deutschland je nach Bundesland an das jeweilige Landesamt. Die Meldung muss vollständig sein: Unvollständige Meldungen können als Pflichtverletzung gewertet werden und die Buße erhöhen. Aber: Wenn nicht alle Informationen vorliegen, erlaubt Art. 33 Abs. 4 DSGVO eine stufenweise Meldung. Das Meldeformular liegt vor. Was muss drin stehen?",
    alertLevel: "critical",
    interactiveObjects: ["monitor-main", "monitor-email", "monitor-phone", "srv-monitor"],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "healthy",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "healthy",
      "srv-firewall": "healthy",
    },
    objectTrigger: "monitor-email",
    timeLimitSec: 420,
    prompts: [
      {
        question:
          "Welche Pflichtangaben muss die Meldung nach Art. 33 Abs. 3 DSGVO an die Aufsichtsbehörde enthalten? Listen Sie alle Punkte auf.",
        placeholder:
          "Art des Verstoßes, betroffene Kategorien, Anzahl Betroffene, Kontaktdaten DSB, Folgen, Maßnahmen...",
        hint: "Art. 33 Abs. 3 DSGVO nennt vier Pflichtbestandteile: (a) Art und Umfang, (b) Kontakt DSB, (c) wahrscheinliche Folgen, (d) ergriffene Maßnahmen.",
      },
      {
        question:
          "Nicht alle forensischen Erkenntnisse liegen noch vor. Wie gehen Sie damit um? Was schreiben Sie in die Meldung?",
        placeholder:
          "Art. 33 Abs. 4 DSGVO: stufenweise Übermittlung – wie begründen und kommunizieren Sie fehlende Informationen?",
        hint: "Dokumentieren Sie explizit, welche Informationen noch ausstehen und bis wann Sie mit einer Nachlieferung rechnen. Transparenz ist Pflicht.",
      },
    ],
    optimalActions: [
      "Alle vier Pflichtbestandteile nach Art. 33 Abs. 3 DSGVO in der Meldung adressieren",
      "Stufenweise Meldung nach Art. 33 Abs. 4 für noch ausstehende Erkenntnisse ankündigen",
      "Kontaktdaten des DSB und der verantwortlichen Stelle korrekt angeben",
      "Zeitpunkt der Kenntnisnahme und der Meldung exakt dokumentieren",
      "Bereits ergriffene Eindämmungsmaßnahmen vollständig auflisten",
    ],
    keyTerms: [
      "Art. 33 DSGVO",
      "Aufsichtsbehörde",
      "72-Stunden-Frist",
      "Meldepflicht",
      "Art. 33 Abs. 3",
      "Art. 33 Abs. 4",
      "stufenweise Meldung",
      "Datenschutzbeauftragter",
      "Pflichtangaben",
      "Kenntnisnahme",
      "Landesamt",
      "Bußgeld",
    ],
    maxScore: 10,
  },
  {
    id: 7,
    phase: "BETROFFENE INFORMIEREN",
    title: "Benachrichtigung von 15.000 betroffenen Personen – Art. 34 DSGVO",
    narrative:
      "Dienstag, 10:00 Uhr. Die Aufsichtsbehörde hat die Meldung bestätigt. Jetzt folgt die schwierigste Kommunikationsaufgabe: 15.000 Menschen müssen darüber informiert werden, dass ihre Gesundheitsdaten und persönlichen Informationen in fremde Hände geraten sind. Die Benachrichtigung muss in klarer, verständlicher Sprache verfasst sein – kein Juristendeutsch. Ein Notfall-Hotline muss eingerichtet werden. Die Presse steht bereits vor der Tür. Und die Betroffenen haben das Recht zu wissen: Was ist passiert? Was droht mir? Was soll ich tun?",
    alertLevel: "warning",
    interactiveObjects: ["monitor-main", "monitor-email", "monitor-phone", "srv-mail"],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "healthy",
      "srv-web": "healthy",
      "srv-mail": "warning",
      "srv-backup": "healthy",
      "srv-monitor": "healthy",
      "srv-firewall": "healthy",
    },
    objectTrigger: "monitor-phone",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Verfassen Sie die wesentlichen Punkte der Benachrichtigung an die Betroffenen nach Art. 34 Abs. 2 DSGVO. Was muss sie enthalten?",
        placeholder:
          "Was ist passiert, welche Daten betroffen, potenzielle Folgen, Schutzmaßnahmen, Kontakt für Rückfragen...",
        hint: "Art. 34 Abs. 2 verweist auf Art. 33 Abs. 3 b)-d): Kontaktdaten DSB, wahrscheinliche Folgen, ergriffene/empfohlene Maßnahmen.",
      },
      {
        question:
          "Welche konkreten Empfehlungen geben Sie den 15.000 betroffenen Personen, um sich vor möglichen Schäden zu schützen?",
        placeholder:
          "Passwortänderung, Kreditauskunft beantragen, Phishing-Warnungen, Kontobewegungen überwachen...",
        hint: "Praktische, umsetzbare Maßnahmen: Passwörter ändern, Kreditauskunft prüfen (Schufa), verdächtige E-Mails melden, Kontoauszüge kontrollieren.",
      },
      {
        question:
          "Wie organisieren Sie die Benachrichtigung für 15.000 Personen? Welche Kanäle nutzen Sie und welche Prioritäten setzen Sie?",
        placeholder:
          "E-Mail, Brief, Webseite, Hotline – Reihenfolge, Zeitplan, besondere Fälle (keine aktive E-Mail-Adresse)...",
        hint: "Priorisieren Sie nach Risiko: Personen mit Gesundheitsdaten zuerst. Nutzen Sie mehrere Kanäle, dokumentieren Sie den Versand.",
      },
    ],
    optimalActions: [
      "Benachrichtigungsschreiben in klarer, verständlicher Sprache (kein Juristendeutsch) verfassen",
      "Alle Pflichtinhalte nach Art. 34 Abs. 2 DSGVO aufnehmen",
      "Notfall-Hotline einrichten und Mitarbeiter schulen",
      "FAQ-Seite für Betroffene auf der Unternehmenswebseite veröffentlichen",
      "Dokumentation des Benachrichtigungsprozesses für Nachweispflicht nach Art. 5 Abs. 2 DSGVO",
    ],
    keyTerms: [
      "Art. 34 DSGVO",
      "Betroffenenrechte",
      "Benachrichtigung",
      "klare Sprache",
      "Hotline",
      "FAQ",
      "Schutzmaßnahmen",
      "Passwortänderung",
      "Rechenschaftspflicht",
      "Art. 5 Abs. 2",
      "Dokumentation",
      "Empfehlungen",
      "Kommunikationskanal",
    ],
    maxScore: 10,
  },
  {
    id: 8,
    phase: "NACHBEREITUNG",
    title: "Post-Incident Review und Prävention",
    narrative:
      "Zwei Wochen nach dem Vorfall. Der unmittelbare Krisenmodus ist vorbei. Die Aufsichtsbehörde hat ein Verfahren eingeleitet – der Ausgang hängt auch davon ab, wie konsequent das Unternehmen aus dem Vorfall lernt. Gemäß Art. 33 Abs. 5 DSGVO müssen alle Datenschutzverletzungen intern dokumentiert bleiben – das Verarbeitungsverzeichnis im Verletzungsregister. Aber wichtiger noch: Wie verhindern Sie, dass so etwas wieder passiert? Kein MFA, keine DLP-Regeln für Massenexporte, kein Phishing-Training – das sind die Lücken. Jetzt ist die Zeit zu handeln.",
    alertLevel: "normal",
    interactiveObjects: [
      "srv-db",
      "srv-firewall",
      "srv-monitor",
      "monitor-main",
      "srv-backup",
      "srv-app",
    ],
    serverStatuses: {
      "srv-db": "healthy",
      "srv-app": "healthy",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "healthy",
      "srv-firewall": "healthy",
    },
    objectTrigger: "srv-monitor",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Was muss im internen Verletzungsregister nach Art. 33 Abs. 5 DSGVO dokumentiert werden? Welche Informationen sind dauerhaft zu führen?",
        placeholder:
          "Umfang der Verletzung, Auswirkungen, ergriffene Abhilfemaßnahmen, Meldungen – was gehört ins Register?",
        hint: "Art. 33 Abs. 5: Mindestens Umstand, Auswirkung und Abhilfemaßnahme. In der Praxis auch: Timeline, beteiligte Systeme, Benachrichtigungen.",
      },
      {
        question:
          "Welche technischen und organisatorischen Maßnahmen (TOMs) leiten Sie aus dem Vorfall ab? Priorisieren Sie nach Wirksamkeit.",
        placeholder:
          "MFA, DLP-Regeln, Netzwerksegmentierung, Phishing-Training, Access Control Reviews, Monitoring...",
        hint: "Quick Wins vs. mittelfristige Maßnahmen: MFA sofort, DLP-Regeln für Massenexport, regelmäßige Phishing-Simulationen, Privileged Access Management.",
      },
      {
        question:
          "Wie bewerten Sie die rechtlichen Risiken des Unternehmens nach diesem Vorfall und welche Schritte können das Bußgeld-Risiko minimieren?",
        placeholder:
          "Art. 83 DSGVO: bis 4% des weltweiten Jahresumsatzes. Welche Faktoren mildern, welche erschwerend?",
        hint: "Mildernde Faktoren nach Art. 83: Kooperation mit Behörden, schnelle Reaktion, ergriffene Maßnahmen, keine Vorsätzlichkeit. Erschwerend: fehlende MFA, kein Phishing-Training.",
      },
    ],
    optimalActions: [
      "Verletzungsregister nach Art. 33 Abs. 5 DSGVO vollständig und dauerhaft pflegen",
      "MFA für alle privilegierten Konten und Remote-Zugriffe sofort einführen",
      "DLP-Regeln für Massenexporte aus der Kundendatenbank konfigurieren",
      "Phishing-Awareness-Training für alle Mitarbeiter mandatorisch einführen",
      "Privileged Access Management (PAM) und regelmäßige Access Reviews implementieren",
    ],
    keyTerms: [
      "Art. 33 Abs. 5",
      "Verletzungsregister",
      "TOMs",
      "MFA",
      "DLP",
      "Phishing-Training",
      "Post-Incident Review",
      "Art. 83 DSGVO",
      "Bußgeld",
      "Privileged Access Management",
      "Netzwerksegmentierung",
      "Rechenschaftspflicht",
      "technisch-organisatorische Maßnahmen",
    ],
    maxScore: 10,
  },
];

export const DATA_BREACH_META = {
  title: "Datenleck & DSGVO-Meldung",
  category: "data",
  estimatedMinutes: 30,
  phaseCount: 8,
};

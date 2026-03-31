// ─── Ransomware Attack Scenario ──────────────────────────────────────────────
// BSI/NIST-aligned incident response simulation in 8 phases.
// All narrative text in German.

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

export const RANSOMWARE_SCENES: GameScene[] = [
  // ─── Phase 1: ERKENNUNG ────────────────────────────────────────────────────
  {
    id: 1,
    phase: "ERKENNUNG",
    title: "Etwas stimmt hier nicht",
    narrative:
      "08:47 Uhr. Du sitzt an deinem Arbeitsplatz und willst die morgendliche Ablage öffnen. " +
      "Stattdessen starrt dich ein schwarzer Bildschirm mit rotem Text an: " +
      "\"YOUR FILES HAVE BEEN ENCRYPTED. Pay 50 BTC within 72 hours.\" " +
      "Im Explorer liegen hunderte Dateien mit der Endung .locked – deine gesamten Projektdaten. " +
      "Neben dir stöhnt ein Kollege: \"Bei mir auch alles weg.\" " +
      "Dein Instinkt schreit: Neustart! Aber genau das könnte alles noch schlimmer machen. " +
      "Was ist dein erster Schritt?",
    alertLevel: "critical",
    interactiveObjects: [
      "monitor-main",
      "monitor-email",
      "srv-app",
      "srv-db",
      "monitor-phone",
    ],
    serverStatuses: {
      "srv-db": "critical",
      "srv-app": "critical",
      "srv-web": "warning",
      "srv-mail": "warning",
      "srv-backup": "healthy",
      "srv-monitor": "healthy",
      "srv-firewall": "healthy",
    },
    objectTrigger: "monitor-main",
    timeLimitSec: 180,
    prompts: [
      {
        question:
          "Du siehst die Lösegeldforderung auf deinem Monitor. Was ist dein allererster Schritt – und was darfst du auf keinen Fall tun?",
        placeholder:
          "z.B. IT-Sicherheit sofort melden, NICHT neu starten, Rechner nicht ausschalten...",
        hint: "Ein Neustart kann laufende Prozesse des Angreifers stoppen – aber auch forensische Spuren vernichten und in manchen Fällen den Master Boot Record überschreiben.",
      },
      {
        question:
          "Wen musst du in welcher Reihenfolge sofort informieren? Nenne konkrete Ansprechpartner und Kommunikationswege.",
        placeholder:
          "z.B. IT-Helpdesk, direkter Vorgesetzter, CISO, Notfallnummer...",
        hint: "Out-of-Band-Kommunikation ist entscheidend – wenn die E-Mail-Infrastruktur kompromittiert ist, kann der Angreifer mitlesen.",
      },
      {
        question:
          "Welche Informationen zur Ransomware-Nachricht und zum Zustand deines Systems solltest du sofort sichern (dokumentieren), bevor irgendetwas verändert wird?",
        placeholder:
          "z.B. Screenshot der Lösegeldforderung, betroffene Dateinamen, Uhrzeit des ersten Auftretens...",
        hint: "Forensische Erstdokumentation ist der Grundstein jeder späteren Analyse – Beweise verfallen schnell.",
      },
    ],
    optimalActions: [
      "Sofortiger Screenshot der Lösegeldforderung als Beweissicherung",
      "IT-Sicherheit / CISO über Out-of-Band-Kanal (Telefon, nicht E-Mail) informieren",
      "System NICHT neu starten und NICHT herunterfahren",
      "Netzwerkkabel NICHT eigenständig ziehen – warten auf Anweisung der IT",
      "Kollegen im direkten Umfeld mündlich warnen, keine Panik-E-Mail versenden",
    ],
    keyTerms: [
      "melden",
      "screenshot",
      "nicht neu starten",
      "it-sicherheit",
      "ciso",
      "telefon",
      "out-of-band",
      "dokumentieren",
      "beweissicherung",
      "forensik",
      "nicht ausschalten",
      "lösegeldforderung",
    ],
    maxScore: 10,
  },

  // ─── Phase 2: EINDÄMMUNG ───────────────────────────────────────────────────
  {
    id: 2,
    phase: "EINDÄMMUNG",
    title: "Den Brand einkreisen",
    narrative:
      "08:53 Uhr. Das IT-Sicherheitsteam ist alarmiert. Auf dem zentralen Monitoring-Dashboard " +
      "leuchten zwanzig rote Alarme gleichzeitig auf – der Angriff breitet sich aktiv aus. " +
      "Jede Minute, in der die infizierten Systeme im Netzwerk verbleiben, verschlüsselt die Ransomware " +
      "weitere Dateiserver. Das Netzwerk muss JETZT segmentiert werden. " +
      "Der Firewall-Administrator ruft: \"Soll ich alles abschalten?\" " +
      "Falsche Entscheidungen hier können den Wiederherstellungsaufwand verdoppeln. " +
      "Zeige, dass du weißt, wie man lateral movement stoppt.",
    alertLevel: "critical",
    interactiveObjects: [
      "srv-firewall",
      "network-switch",
      "emergency-stop",
      "srv-monitor",
      "srv-backup",
    ],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "critical",
      "srv-web": "critical",
      "srv-mail": "critical",
      "srv-backup": "warning",
      "srv-monitor": "warning",
      "srv-firewall": "warning",
    },
    objectTrigger: "network-switch",
    timeLimitSec: 240,
    prompts: [
      {
        question:
          "Beschreibe die konkrete Vorgehensweise zur Netzwerkisolation: Welche Systeme werden in welcher Reihenfolge getrennt, und welche bleiben bewusst online?",
        placeholder:
          "z.B. infizierte Segmente isolieren, Backup-Server zuerst schützen, Monitoring-Netz erhalten...",
        hint: "Nicht alles auf einmal abschalten – das Monitoring-Netz und der Backup-Server brauchen separate, geschützte Verbindungen.",
      },
      {
        question:
          "Wie stellt das Team sicher, dass die Kommunikation während der Eindämmung sicher und angreiferresistent bleibt?",
        placeholder:
          "z.B. verschlüsselter Messenger, Mobiltelefone, separates Notfall-WLAN, physisches Whiteboard...",
        hint: "Out-of-Band bedeutet: Ein Kommunikationskanal, der vollständig außerhalb der kompromittierten Infrastruktur liegt.",
      },
    ],
    optimalActions: [
      "Infizierte Netzwerksegmente sofort vom Core-Netz trennen (VLAN-Isolation / Switch-Ports deaktivieren)",
      "Backup-Server und -Netz als erstes physisch isolieren und schützen",
      "Monitoring-Infrastruktur in separatem, geschütztem Netz belassen",
      "Out-of-Band-Kommunikation via Mobiltelefon oder verschlüsseltem Messenger etablieren",
      "Active Directory / Domain Controller auf Kompromittierung prüfen und ggf. isolieren",
    ],
    keyTerms: [
      "netzwerkisolation",
      "segmentierung",
      "vlan",
      "lateral movement",
      "backup-server",
      "out-of-band",
      "domain controller",
      "active directory",
      "firewall",
      "switch",
      "eindämmung",
      "isolieren",
      "netzwerkkabel",
    ],
    maxScore: 10,
  },

  // ─── Phase 3: IR-TEAM ──────────────────────────────────────────────────────
  {
    id: 3,
    phase: "IR-TEAM",
    title: "Kriegsrat einberufen",
    narrative:
      "09:10 Uhr. Die unmittelbare Ausbreitung ist gestoppt. Jetzt beginnt der eigentliche Kampf. " +
      "Der Besprechungsraum füllt sich: IT-Leiter, CISO, Datenschutzbeauftragter, Geschäftsführung, " +
      "Rechtsabteilung und externe Forensiker warten auf Koordination. " +
      "Ohne klare Rollenverteilung entsteht Chaos – jeder tut etwas anderes, Informationen gehen verloren, " +
      "Fehler werden gemacht. Der CISO sieht dich an: \"Wie organisieren wir das?\" " +
      "Incident Response ist Teamarbeit mit klarer Struktur.",
    alertLevel: "critical",
    interactiveObjects: [
      "monitor-main",
      "monitor-phone",
      "srv-monitor",
      "monitor-email",
    ],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "critical",
      "srv-mail": "offline",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "warning",
    },
    objectTrigger: "monitor-main",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Welche Rollen müssen im Incident Response Team (IRT) besetzt sein, und wer ist für was verantwortlich?",
        placeholder:
          "z.B. Incident Commander, technischer Lead, Kommunikationsverantwortlicher, Rechtsbeistand...",
        hint: "Ein gutes IRT hat klare Verantwortlichkeiten – niemand soll zwei kritische Rollen gleichzeitig innehaben.",
      },
      {
        question:
          "Welche Informationen, Werkzeuge und Ressourcen muss der War Room (Lagezentrum) sofort zur Verfügung stellen?",
        placeholder:
          "z.B. Netzwerktopologie, IR-Playbook, Kontaktliste, forensische Workstation, Logzugang...",
        hint: "Der IR-Plan sollte offline verfügbar sein – wenn er nur auf den infizierten Servern liegt, hilft er nicht.",
      },
      {
        question:
          "Wie dokumentiert das Team alle Maßnahmen, Entscheidungen und Zeitstempel lückenlos für spätere forensische und rechtliche Zwecke?",
        placeholder:
          "z.B. physisches Logbuch, verschlüsseltes Ticketsystem auf Notfallsystem, Zeitstempel-Protokoll...",
        hint: "Lückenlose Chain of Custody ist Voraussetzung für strafrechtliche Verfolgung und Versicherungsansprüche.",
      },
    ],
    optimalActions: [
      "Incident Commander als Single Point of Authority benennen",
      "Technisches Forensik-Team, Kommunikationsteam und Rechts-/Compliance-Team parallel aktivieren",
      "Physisches War Room Logbuch mit Zeitstempeln für alle Aktionen anlegen",
      "IR-Playbook (offline) als Arbeitsgrundlage verwenden",
      "Externe forensische Spezialisten und ggf. Cyber-Versicherung kontaktieren",
    ],
    keyTerms: [
      "incident commander",
      "rollenverteilung",
      "war room",
      "ir-playbook",
      "forensik",
      "logbuch",
      "zeitstempel",
      "chain of custody",
      "cyber-versicherung",
      "koordination",
      "kommunikation",
      "eskalation",
    ],
    maxScore: 10,
  },

  // ─── Phase 4: ANALYSE ──────────────────────────────────────────────────────
  {
    id: 4,
    phase: "ANALYSE",
    title: "Den Feind kennen",
    narrative:
      "09:45 Uhr. Während ein Teil des Teams die Lage stabilisiert, beginnt die forensische Analyse. " +
      "Auf einem isolierten Forensik-Laptop öffnet der Analyst die ersten Log-Dateien. " +
      "Der initiale Infection Vector war eine Phishing-E-Mail, die vor drei Tagen einen Mitarbeiter in der " +
      "Buchhaltung traf – seitdem hat sich der Angreifer im Netzwerk bewegt, Credentials gestohlen, " +
      "Backups gefunden und gezielt erste Verschlüsselungen gestartet. " +
      "\"Wie weit sind sie gekommen?\" ist die entscheidende Frage. " +
      "Blast Radius bestimmen: Was ist verloren, was ist noch sicher?",
    alertLevel: "critical",
    interactiveObjects: [
      "srv-monitor",
      "srv-backup",
      "srv-db",
      "srv-app",
      "monitor-main",
    ],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "warning",
      "srv-monitor": "warning",
      "srv-firewall": "warning",
    },
    objectTrigger: "srv-monitor",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Wie bestimmst du den Blast Radius des Angriffs? Welche Systeme, Daten und Nutzerkonten könnten kompromittiert sein?",
        placeholder:
          "z.B. betroffene Systeme inventarisieren, kompromittierte Konten identifizieren, Datenkategorien prüfen...",
        hint: "Gehe davon aus, dass alle Credentials auf betroffenen Systemen als kompromittiert gelten, bis das Gegenteil bewiesen ist.",
      },
      {
        question:
          "Welche Methoden nutzt du, um die Ransomware-Variante zu identifizieren und den initialen Angriffsvektor zu rekonstruieren?",
        placeholder:
          "z.B. Ransomware-Identifikation via ID Ransomware, Loganalyse, E-Mail-Header auswerten, SIEM-Abfragen...",
        hint: "ID Ransomware (nomoreransom.org) kann anhand der Dateiendung und des Lösegeldforderungs-Textes die Variante bestimmen.",
      },
      {
        question:
          "Wie überprüfst du die Integrität der Backup-Systeme und stellst sicher, dass auch diese nicht kompromittiert wurden?",
        placeholder:
          "z.B. Checksummen-Vergleich, Backup-Log-Analyse, Air-Gap-Status prüfen, Testwiederherstellung auf isoliertem System...",
        hint: "Professionelle Ransomware-Gruppen zielen bewusst zuerst auf Backup-Systeme, bevor die Hauptverschlüsselung startet.",
      },
    ],
    optimalActions: [
      "Forensische Kopien (Disk Images) aller betroffenen Systeme vor jeder Analyse erstellen",
      "Ransomware-Variante via ID Ransomware / nomoreransom.org identifizieren",
      "SIEM-Logs und Active Directory Event Logs auf laterale Bewegung und Credential Dumping analysieren",
      "Backup-Integrität durch Checksummen und isolierten Testwiederherstellungsversuch prüfen",
      "Initialen Angriffsvektor (Phishing-E-Mail, RDP-Brute-Force o.ä.) vollständig rekonstruieren",
    ],
    keyTerms: [
      "blast radius",
      "forensik",
      "disk image",
      "angriffsvektor",
      "ransomware-variante",
      "id ransomware",
      "nomoreransom",
      "backup-integrität",
      "siem",
      "log-analyse",
      "credential dumping",
      "lateral movement",
      "air gap",
      "checksumme",
    ],
    maxScore: 10,
  },

  // ─── Phase 5: MELDEPFLICHT ─────────────────────────────────────────────────
  {
    id: 5,
    phase: "MELDEPFLICHT",
    title: "Behörden, Recht und Pflicht",
    narrative:
      "11:20 Uhr. Die erste Schockwelle ist überstanden, doch jetzt droht eine andere Gefahr: " +
      "rechtliche Konsequenzen durch verpasste Meldefristen. " +
      "Die DSGVO gibt 72 Stunden ab Kenntnisnahme – die Uhr läuft seit 08:47 Uhr. " +
      "Personenbezogene Daten von Mitarbeitern und möglicherweise Kunden sind auf den verschlüsselten " +
      "Servern gespeichert gewesen. Gleichzeitig ist das Unternehmen als kritische Infrastruktur " +
      "beim BSI registriert – auch dort gibt es strenge Meldefristen. " +
      "Der Datenschutzbeauftragte schaut nervös auf die Uhr. Zeit zum Handeln.",
    alertLevel: "warning",
    interactiveObjects: [
      "monitor-email",
      "monitor-phone",
      "monitor-main",
      "srv-monitor",
    ],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "warning",
    },
    objectTrigger: "monitor-email",
    timeLimitSec: 300,
    prompts: [
      {
        question:
          "Welche Behörden müssen innerhalb welcher Fristen über den Ransomware-Angriff informiert werden, und was muss der Meldung beigelegt werden?",
        placeholder:
          "z.B. Datenschutzaufsichtsbehörde (72h DSGVO), BSI (KRITIS), LKA Cybercrime, ggf. BKA...",
        hint: "Die DSGVO-Meldung erfolgt an die zuständige Landesdatenschutzbehörde. Bei KRITIS-Betreibern kommt die BSI-Meldepflicht nach § 8b BSIG hinzu.",
      },
      {
        question:
          "Wie kommunizierst du den Vorfall intern (Mitarbeiter) und extern (Kunden, Partner, Öffentlichkeit), ohne die laufende forensische Untersuchung zu gefährden oder den Angreifer zu warnen?",
        placeholder:
          "z.B. interne Kommunikation über sicheren Kanal, externe PR-Strategie, kein Detail zu laufender Analyse...",
        hint: "Zu viele Details in der Erstmeldung können dem Angreifer verraten, wie weit die Analyse fortgeschritten ist.",
      },
    ],
    optimalActions: [
      "Datenschutzaufsichtsbehörde innerhalb von 72 Stunden gemäß Art. 33 DSGVO melden",
      "BSI nach § 8b BSIG unverzüglich informieren (bei KRITIS-Betreiber)",
      "LKA Cybercrime / Zentrale Ansprechstelle Cybercrime (ZAC) Strafanzeige erstatten",
      "Interne Mitarbeiterkommunikation über sicheren Out-of-Band-Kanal mit sachlicher Information",
      "Kunden und Partner über potenzielle Datenschutzverletzung informieren (Art. 34 DSGVO)",
    ],
    keyTerms: [
      "dsgvo",
      "72 stunden",
      "datenschutzbehörde",
      "art. 33",
      "bsi",
      "kritis",
      "bsig",
      "lka",
      "bka",
      "strafanzeige",
      "meldepflicht",
      "datenschutzverletzung",
      "cyber crime",
    ],
    maxScore: 10,
  },

  // ─── Phase 6: RECOVERY-ENTSCHEIDUNG ───────────────────────────────────────
  {
    id: 6,
    phase: "RECOVERY-ENTSCHEIDUNG",
    title: "Zahlen oder kämpfen?",
    narrative:
      "14:00 Uhr. Fünf Stunden nach dem ersten Alarm sitzt die Geschäftsführung zusammen. " +
      "Auf dem Tisch liegt die Lösegeldforderung: 50 Bitcoin – ungefähr 2,5 Millionen Euro. " +
      "\"Wenn wir nicht zahlen, sind wir drei Wochen offline\", sagt der IT-Leiter. " +
      "\"Wenn wir zahlen, finanzieren wir die Kriminellen und haben keine Garantie\", antwortet der CISO. " +
      "Die gute Nachricht: Die Backup-Prüfung hat ergeben, dass die letzten sauberen Backups " +
      "vom Abend vor dem Angriff existieren und integer sind. " +
      "Die schlechte Nachricht: Ein Decrypt kann Wochen dauern. Und ALLE Passwörter müssen zurückgesetzt werden. " +
      "Eine Entscheidung muss jetzt getroffen werden.",
    alertLevel: "warning",
    interactiveObjects: [
      "monitor-main",
      "srv-backup",
      "monitor-phone",
      "srv-firewall",
    ],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "warning",
    },
    objectTrigger: "srv-backup",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Welche Argumente sprechen gegen die Lösegeldzahlung, und unter welchen (seltenen) Umständen könnte eine Zahlung überhaupt in Betracht gezogen werden?",
        placeholder:
          "z.B. keine Entschlüsselungsgarantie, Finanzierung von Kriminellen, Wiederholungsrisiko, Sanktionslisten...",
        hint: "In einigen Ländern ist die Zahlung an bestimmte Ransomware-Gruppen (z.B. OFAC-gelistete) rechtlich verboten.",
      },
      {
        question:
          "Welche Schritte sind notwendig, bevor mit der Wiederherstellung aus Backups begonnen werden kann? Was muss sichergestellt sein?",
        placeholder:
          "z.B. saubere Umgebung vorbereiten, Malware vollständig entfernt, alle Credentials zurückgesetzt...",
        hint: "Wenn der initiale Angriffsvektor nicht geschlossen ist, wird die wiederhergestellte Umgebung erneut infiziert.",
      },
      {
        question:
          "Warum müssen ALLE Passwörter und Zugangsdaten zurückgesetzt werden – auch die von Systemen, die scheinbar nicht betroffen waren?",
        placeholder:
          "z.B. Credential Harvesting, Pass-the-Hash, Golden Ticket, Persistence via Backdoors...",
        hint: "Angreifer nutzen Tools wie Mimikatz, um alle Credentials aus dem Speicher zu extrahieren – auch von vermeintlich sicheren Systemen.",
      },
    ],
    optimalActions: [
      "Lösegeld NICHT zahlen – keine Entschlüsselungsgarantie, Finanzierung krimineller Strukturen",
      "Backup-Integrität final bestätigen und Wiederherstellungsplan aus sauberen Backups erstellen",
      "ALLE Passwörter und Service Accounts zurücksetzen (auch scheinbar unbetroffene Systeme)",
      "Active Directory auf Persistence-Mechanismen (Golden Tickets, Backdoor-Accounts) prüfen und bereinigen",
      "Initialen Angriffsvektor vollständig schließen, bevor Wiederherstellung beginnt",
    ],
    keyTerms: [
      "kein lösegeld",
      "backup-wiederherstellung",
      "credential reset",
      "passwort zurücksetzen",
      "persistence",
      "golden ticket",
      "mimikatz",
      "backdoor",
      "angriffsvektor schließen",
      "saubere umgebung",
      "active directory",
      "ofac",
    ],
    maxScore: 10,
  },

  // ─── Phase 7: WIEDERHERSTELLUNG ────────────────────────────────────────────
  {
    id: 7,
    phase: "WIEDERHERSTELLUNG",
    title: "Aufstehen und absichern",
    narrative:
      "Tag 2 – 07:30 Uhr. Die Entscheidung ist gefallen: Wiederherstellung aus Backups, kein Lösegeld. " +
      "Das Team hat die Nacht durchgearbeitet. Jetzt wird die Infrastruktur in einer frisch aufgesetzten, " +
      "isolierten Umgebung wiederhergestellt. Aber Vorsicht: Zu schnelle Wiederherstellung ohne " +
      "ausreichende Prüfung führt zur Reinfektion. " +
      "Auf jedem wiederhergestellten Server wird Enhanced Monitoring aktiviert – " +
      "verdächtige Aktivitäten sollen sofort sichtbar werden. " +
      "Canary Files werden strategisch platziert: kleine, attraktive Datei-Köder, " +
      "die sofort Alarm schlagen, wenn jemand sie versucht zu verschlüsseln. " +
      "Langsam kehrt das Licht in den Serverraum zurück.",
    alertLevel: "warning",
    interactiveObjects: [
      "srv-backup",
      "srv-db",
      "srv-app",
      "srv-monitor",
      "srv-firewall",
      "network-switch",
    ],
    serverStatuses: {
      "srv-db": "warning",
      "srv-app": "warning",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "healthy",
      "srv-monitor": "healthy",
      "srv-firewall": "healthy",
    },
    objectTrigger: "srv-backup",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Beschreibe einen sicheren, phasenweisen Wiederherstellungsplan – welche Systeme werden in welcher Reihenfolge wiederhergestellt und warum?",
        placeholder:
          "z.B. zuerst Infrastruktur (AD, DNS), dann kritische Geschäftssysteme, dann Produktivsysteme, zuletzt E-Mail...",
        hint: "Identitäts- und Verzeichnisdienste (Active Directory) müssen vollständig sauber sein, bevor andere Systeme hochgefahren werden.",
      },
      {
        question:
          "Was sind Canary Files und Enhanced Monitoring in diesem Kontext, und wie setzt du sie zur Früherkennung einer Reinfektion ein?",
        placeholder:
          "z.B. Canary Files als Köder-Dateien, Honeypot-Shares, Monitoring auf Dateiänderungen, SIEM-Alerting...",
        hint: "Canary Files sind attraktiv benannte Dateien (z.B. passwords.xlsx) an exponierten Speicherorten – jede Änderung löst sofort Alarm aus.",
      },
    ],
    optimalActions: [
      "Wiederherstellung in isolierter Quarantäne-Umgebung beginnen, bevor Verbindung zum Produktionsnetz",
      "Active Directory und Identity Services als erstes vollständig sauber wiederherstellen",
      "Phasenweise Wiederherstellung: Infrastruktur > kritische Systeme > Produktivsysteme > E-Mail",
      "Canary Files an exponierten Netzwerkfreigaben und kritischen Verzeichnissen platzieren",
      "Enhanced Monitoring / EDR auf allen wiederhergestellten Systemen vor der Netzwerkverbindung aktivieren",
    ],
    keyTerms: [
      "phasenweise wiederherstellung",
      "quarantäne",
      "canary files",
      "honeypot",
      "enhanced monitoring",
      "edr",
      "active directory",
      "reinfektion",
      "siem",
      "alerting",
      "backup-restore",
      "identity services",
    ],
    maxScore: 10,
  },

  // ─── Phase 8: NACHBEREITUNG ────────────────────────────────────────────────
  {
    id: 8,
    phase: "NACHBEREITUNG",
    title: "Aus dem Angriff lernen",
    narrative:
      "Tag 14. Die Systeme laufen wieder. Der schlimmste Alptraum ist überstanden – " +
      "aber die Arbeit ist noch lange nicht getan. " +
      "Im großen Konferenzraum findet das Post-Incident Review statt. " +
      "Auf dem Whiteboard stehen drei Fragen: Was ist passiert? Was haben wir richtig gemacht? " +
      "Was müssen wir ändern? Der Angriff hat Schwachstellen aufgedeckt: " +
      "kein MFA, Backups ohne Air Gap, flache Netzwerkstruktur, veraltetes IR-Playbook. " +
      "Jetzt ist die Chance, das ISMS wirklich zu stärken. " +
      "Denn Ransomware-Gruppen kommen zurück – aber das nächste Mal seid ihr bereit.",
    alertLevel: "normal",
    interactiveObjects: [
      "monitor-main",
      "srv-monitor",
      "srv-backup",
      "srv-firewall",
      "network-switch",
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
    objectTrigger: "monitor-main",
    timeLimitSec: null,
    prompts: [
      {
        question:
          "Welche konkreten technischen Maßnahmen müssen jetzt sofort umgesetzt werden, um einen erneuten Ransomware-Angriff zu erschweren?",
        placeholder:
          "z.B. MFA für alle Konten, EDR-Deployment, Netzwerksegmentierung, Privileged Access Management...",
        hint: "MFA allein hätte in vielen bekannten Ransomware-Fällen die initiale Kompromittierung verhindert oder deutlich erschwert.",
      },
      {
        question:
          "Erkläre die 3-2-1 Backup-Strategie und warum sie für die Ransomware-Resilienz entscheidend ist.",
        placeholder:
          "z.B. 3 Kopien auf 2 verschiedenen Medien mit 1 Kopie offline/Air-Gap...",
        hint: "Eine Air-Gap-Kopie bedeutet, dass ein Medium physisch vom Netzwerk getrennt ist – Ransomware kann es nicht erreichen.",
      },
      {
        question:
          "Was muss das aktualisierte IR-Playbook enthalten, damit das Team beim nächsten Vorfall schneller und besser reagiert?",
        placeholder:
          "z.B. Kontaktlisten, Entscheidungsbäume, Eskalationspfade, Kommunikationsvorlagen, Übungsplan...",
        hint: "Ein IR-Playbook, das nie geübt wurde, ist im Ernstfall so gut wie wertlos – regelmäßige Tabletop-Übungen sind Pflicht.",
      },
    ],
    optimalActions: [
      "MFA für alle Nutzerkonten und privilegierten Zugänge (PAM) sofort einführen",
      "3-2-1 Backup-Strategie mit mindestens einer Air-Gap-Kopie implementieren",
      "Netzwerksegmentierung und Zero-Trust-Prinzip in der Infrastruktur umsetzen",
      "EDR-Lösung (Endpoint Detection & Response) flächendeckend ausrollen",
      "IR-Playbook aktualisieren und jährliche Tabletop-Übungen verpflichtend einplanen",
    ],
    keyTerms: [
      "mfa",
      "multi-faktor",
      "3-2-1 backup",
      "air gap",
      "netzwerksegmentierung",
      "zero trust",
      "edr",
      "pam",
      "privileged access",
      "ir-playbook",
      "tabletop",
      "lessons learned",
      "post-incident review",
    ],
    maxScore: 10,
  },
];

export const RANSOMWARE_META = {
  title: "Ransomware-Angriff",
  category: "cyber",
  estimatedMinutes: 25,
  phaseCount: 8,
};

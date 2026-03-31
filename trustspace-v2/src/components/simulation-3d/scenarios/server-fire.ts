// Scenario: Serverraum-Brand
// ISO 27001 Annex A.7.5, A.8.1 | German fire safety: ASR A2.2, DIN 14096 Brandschutzordnung
// No imports — standalone data file consumed by the game engine.

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

export const SERVER_FIRE_SCENES: GameScene[] = [
  // ─── Phase 1: BRANDFRÜHERKENNUNG ─────────────────────────────────────────
  {
    id: 0,
    phase: "BRANDFRÜHERKENNUNG",
    title: "VESDA-Alarm – Rauchpartikel erkannt",
    narrative:
      "Dienstag, 02:17 Uhr. Der Bereitschaftsdienst-Pager vibriert. Das VESDA-System " +
      "(Very Early Smoke Detection Apparatus) schlägt an: Rauchpartikel-Konzentration in Rack-Zone B des " +
      "Serverraums bei 0,08 %obs/m — unterhalb der Auslöseschwelle, aber weit über dem Warn-Threshold. " +
      "Das Gebäudemanagementsystem (BMS) leuchtet orange auf dem Kontrollmonitor.\n\n" +
      "Die Klimaanlage läuft normal, kein sichtbarer Qualm ist per CCTV erkennbar. " +
      "Könnte ein Fehlalarm durch Staub sein — oder der Beginn eines Schwelbrandes hinter den Rackkacheln. " +
      "Jede Minute zählt. Prüfen Sie den Monitoring-Server.",
    alertLevel: "warning",
    interactiveObjects: ["srv-monitor", "monitor-main", "monitor-email"],
    serverStatuses: {
      "srv-db": "healthy",
      "srv-app": "healthy",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "healthy",
    },
    objectTrigger: "srv-monitor",
    timeLimitSec: 120,
    prompts: [
      {
        question: "Der VESDA-Alarm zeigt einen Frühwarnzustand. Was sind Ihre ersten drei Handlungsschritte?",
        placeholder: "1. ... 2. ... 3. ...",
        hint: "Denken Sie an: BMS-Panel prüfen, Brandschutzbeauftragten informieren, Fehlalarm-Kriterien kennen.",
      },
      {
        question: "Wann würden Sie diesen Alarm als Fehlalarm einstufen und wann als echte Bedrohung? Nennen Sie konkrete Kriterien.",
        placeholder: "Fehlalarm-Indizien vs. Echtbrand-Kriterien...",
        hint: "VESDA-Schwellwerte, Temperaturanstieg, Mehrfachsensorbestätigung, Zwei-Personen-Prinzip.",
      },
    ],
    optimalActions: [
      "BMS-Panel aufrufen und VESDA-Rohwerte sowie Trend der letzten 5 Minuten ablesen",
      "Brandschutzbeauftragten und Objektschutz sofort per Telefon informieren",
      "CCTV-Kameras im Serverraum auf thermische Auffälligkeiten prüfen",
      "Zweite Person zur physischen Sichtprüfung der Rack-Zone B anfordern (Vier-Augen-Prinzip)",
      "Bereitschaftsdokumentation öffnen und Uhrzeit sowie Sensorwerte protokollieren",
    ],
    keyTerms: [
      "VESDA", "BMS", "Frühwarnung", "Brandschutzbeauftragter", "Fehlalarm", "Schwellwert",
      "CCTV", "Sichtprüfung", "protokollieren", "Objektschutz", "Zwei-Personen", "Rauchpartikel",
      "Thermal",
    ],
    maxScore: 10,
  },

  // ─── Phase 2: ALARMVERIFIKATION ──────────────────────────────────────────
  {
    id: 1,
    phase: "ALARMVERIFIKATION",
    title: "Brandherd bestätigt – Klasse F-Ausschluss",
    narrative:
      "02:24 Uhr. Ihr Kollege tritt in den Serverraum und meldet sofort per Headset: " +
      "'Leichter Brandgeruch, Rack B-07 zeigt erhöhte Oberflächen­temperatur. Kein Sichtqualm, " +
      "aber die Wärmebildkamera zeigt einen Hotspot bei 68°C an der Rückseite des App-Servers.'\n\n" +
      "Der zweite VESDA-Sensor bestätigt den Anstieg. Das ist kein Staub. Es handelt sich " +
      "wahrscheinlich um einen elektrischen Schwelbrand (Brandklasse E / früher F) — " +
      "Löschmittel Wasser ist verboten. Die automatische Halon-Nachfolgeanlage steht bereit, " +
      "aber die Entscheidungskette muss eingehalten werden. " +
      "Untersuchen Sie den App-Server.",
    alertLevel: "critical",
    interactiveObjects: ["srv-app", "srv-monitor", "monitor-main"],
    serverStatuses: {
      "srv-db": "healthy",
      "srv-app": "critical",
      "srv-web": "healthy",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "healthy",
    },
    objectTrigger: "srv-app",
    timeLimitSec: 90,
    prompts: [
      {
        question: "Der Brand ist bestätigt. Welche Brandklasse liegt vor und warum ist Wasser als Löschmittel verboten?",
        placeholder: "Brandklasse, elektrische Spannung, Löschmittelwahl...",
        hint: "DIN EN 2 Brandklassen: A=Feststoffe, B=Flüssigkeiten, C=Gase, D=Metalle, F=Speisefette — Elektrobrand ist Klasse E (nicht genormt) oder E-Kennzeichnung.",
      },
      {
        question: "Was ist das Zwei-Personen-Prinzip bei der Brandverifikation und warum ist es hier relevant?",
        placeholder: "Vier-Augen-Prinzip, Fehlalarm-Prävention, Verantwortung...",
      },
      {
        question: "Wen alarmieren Sie jetzt sofort und in welcher Reihenfolge?",
        placeholder: "Notruf 112, interne Meldekette, Brandschutzbeauftragter...",
        hint: "Notruf geht immer zuerst. Danach interne Kette.",
      },
    ],
    optimalActions: [
      "Sofort Notruf 112 absetzen — genaue Adresse, Lage im Gebäude, Art des Brandes angeben",
      "Brandschutzbeauftragten und IT-Leiter wecken und informieren",
      "Alle Personen im Serverraum sofort zum Verlassen anweisen",
      "Elektrischen Brand (keine Wassernutzung) in der Meldung explizit kommunizieren",
      "Automatische Löschanlage auf Bereitschaft prüfen — noch NICHT manuell auslösen",
    ],
    keyTerms: [
      "Notruf", "112", "Brandklasse", "elektrisch", "kein Wasser", "Zwei-Personen", "Vier-Augen",
      "IT-Leiter", "Brandschutzbeauftragter", "evakuieren", "Löschanlage", "FM-200", "Novec",
      "Schwelbrand",
    ],
    maxScore: 10,
  },

  // ─── Phase 3: NOTABSCHALTUNG ─────────────────────────────────────────────
  {
    id: 2,
    phase: "NOTABSCHALTUNG",
    title: "EPO-Entscheidung – Emergency Power Off",
    narrative:
      "02:31 Uhr. Die Feuerwehr ist unterwegs, ETA 6 Minuten. Das Feuer breitet sich langsam aus — " +
      "der App-Server brennt im Inneren. Stromspannung und laufende Systeme versorgen den Brand weiter.\n\n" +
      "Am Eingang des Serverraums hängt der rote EPO-Schalter: Emergency Power Off. " +
      "Ein Druck trennt alle Racksysteme sofort vom Strom — inklusive laufender Datenbanktransaktionen, " +
      "aktiver VPN-Sessions und des Monitoring-Systems selbst. Die USV-Anlage versorgt noch kritische " +
      "Systeme, aber auch sie muss bei Gasauslösung isoliert werden. " +
      "Teilabschaltung oder Vollabschaltung? Die Zeit drängt. " +
      "Drücken Sie den Emergency-Stop.",
    alertLevel: "critical",
    interactiveObjects: ["emergency-stop", "srv-firewall", "network-switch"],
    serverStatuses: {
      "srv-db": "warning",
      "srv-app": "critical",
      "srv-web": "warning",
      "srv-mail": "healthy",
      "srv-backup": "healthy",
      "srv-monitor": "warning",
      "srv-firewall": "healthy",
    },
    objectTrigger: "emergency-stop",
    timeLimitSec: 60,
    prompts: [
      {
        question: "Entscheiden Sie: Vollständige EPO-Abschaltung oder gezielte Teilabschaltung des betroffenen Racks? Begründen Sie Ihre Entscheidung.",
        placeholder: "Vollabschaltung vs. Teilabschaltung, Vor- und Nachteile...",
        hint: "Vollabschaltung = sicherer für Löschanlage, aber alle Systeme offline. Teilabschaltung = Risiko der Brandausbreitung.",
      },
      {
        question: "Welche Systeme dürfen unter keinen Umständen ohne geordnetes Shutdown abgeschaltet werden und wie gehen Sie damit um?",
        placeholder: "Datenbanken, laufende Transaktionen, USV, kritische Services...",
      },
    ],
    optimalActions: [
      "Vollständigen EPO auslösen — Brandsicherheit hat absoluten Vorrang vor Datenverfügbarkeit",
      "Vor EPO: Datenbankadmins benachrichtigen, damit offene Transaktionen wenn möglich geschlossen werden",
      "USV-Anlage nach EPO ebenfalls deaktivieren, um Gasauslösung nicht zu behindern",
      "EPO-Zeitpunkt exakt protokollieren für spätere forensische Auswertung",
    ],
    keyTerms: [
      "EPO", "Emergency Power Off", "Vollabschaltung", "Teilabschaltung", "USV", "Unterbrechungsfreie Stromversorgung",
      "Brandsicherheit", "Datenverfügbarkeit", "Datenbank", "Transaktion", "Protokollieren",
      "Strom trennen", "Rack",
    ],
    maxScore: 10,
  },

  // ─── Phase 4: EVAKUIERUNG ────────────────────────────────────────────────
  {
    id: 3,
    phase: "EVAKUIERUNG",
    title: "30-Sekunden-Countdown – Raum muss frei sein",
    narrative:
      "02:33 Uhr. EPO wurde ausgelöst. Die Racksysteme sind stromlos. Im Serverraum leuchtet " +
      "jetzt das rote Stroboskoplicht der Gasvorwarnanlage — der automatische Countdown läuft: " +
      "30 Sekunden bis zur Auslösung der Gaslöschanlage.\n\n" +
      "Ein lauter Summer ertönt. Türmagnete fallen ab, alle Türen schließen sich automatisch. " +
      "Die Klimaanlage schaltet ab — Klappen­schieber isolieren die Zuluftzüge, damit das " +
      "Löschgas nicht entweicht. Irgendwo hustet noch jemand im Serverraum. " +
      "Ist noch jemand drin? Die Evakuierungsliste muss geprüft werden. " +
      "Der Netzwerk-Switch blinkt rot — überprüfen Sie ihn.",
    alertLevel: "critical",
    interactiveObjects: ["network-switch", "emergency-stop", "monitor-main"],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "offline",
      "srv-monitor": "offline",
      "srv-firewall": "offline",
    },
    objectTrigger: "network-switch",
    timeLimitSec: 45,
    prompts: [
      {
        question: "Wie stellen Sie sicher, dass sich keine Person mehr im Serverraum befindet, bevor die Gasanlage auslöst?",
        placeholder: "Zutrittsliste, Kopfzählung, Schlüsselkarte, persönliche Kontrolle...",
        hint: "Zugangssystem-Auswertung, Evakuierungsliste, lautes Ansagen, physische Kontrolle.",
      },
      {
        question: "Was passiert mit der HVAC-Anlage (Klimatechnik) bei der Gasauslösung und warum ist das wichtig?",
        placeholder: "Klappensteuerung, Druckausgleich, Abdichtung des Serverraums...",
      },
      {
        question: "Welche Personengruppen müssen zusätzlich zum IT-Personal beim Verlassen des Gebäudes erfasst werden?",
        placeholder: "Reinigungspersonal, Techniker, Drittfirmen, Nachtdienst...",
      },
    ],
    optimalActions: [
      "Zutrittssystem-Log der letzten 4 Stunden abrufen — alle eingestempelten Personen identifizieren",
      "Lautstark durch alle Bereiche rufen und physisch absuchen (maximal 1 Person, mit Fluchtweg gesichert)",
      "Sammelplatz außerhalb des Gebäudes aufsuchen und Kopfzählung durchführen",
      "HVAC-Abschottung bestätigen — alle Zuluft/Abluft-Klappen müssen geschlossen sein",
      "Türen auf automatischen Schließbetrieb verifizieren — Türen dürfen nicht manuell blockiert werden",
    ],
    keyTerms: [
      "Evakuierung", "Sammelplatz", "Kopfzählung", "Zugangssystem", "HVAC", "Klappen", "Abdichtung",
      "Türmagnet", "Countdown", "Gasvorwarnung", "Reinigungspersonal", "Drittfirmen",
      "niemand im Raum",
    ],
    maxScore: 10,
  },

  // ─── Phase 5: LÖSCHANLAGE ────────────────────────────────────────────────
  {
    id: 4,
    phase: "LÖSCHANLAGE",
    title: "FM-200 Gaslöschanlage ausgelöst",
    narrative:
      "02:34 Uhr. Ein dumpfes Zischen durchdringt die Wände — die FM-200-Gaslöschanlage " +
      "(HFC-227ea) hat ausgelöst. Innerhalb von 10 Sekunden füllt das farblose, geruchlose Gas " +
      "den Serverraum auf die Löschkonzentration von 7,9 % Vol. auf. " +
      "Der Brand wird durch Sauerstoffentzug und chemische Reaktionshemmung erstickt.\n\n" +
      "Durch das Sichtfenster in der Stahltür sehen Sie weiße Gas­wolken und Kondensation. " +
      "Ein Mitarbeiter will die Tür aufreißen — er glaubt, sein Laptop liege noch drin. " +
      "Ein anderer fragt, ob das Gas giftig sei. Halten Sie den Serverraum versiegelt. " +
      "Prüfen Sie den Feuer­löschungs­status am Monitoring-Terminal.",
    alertLevel: "critical",
    interactiveObjects: ["fire-extinguisher", "monitor-main", "emergency-stop"],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "offline",
      "srv-monitor": "offline",
      "srv-firewall": "offline",
    },
    objectTrigger: "fire-extinguisher",
    timeLimitSec: 90,
    prompts: [
      {
        question: "Ein Mitarbeiter will den Serverraum betreten, um seinen Laptop zu holen. Wie reagieren Sie und mit welcher Begründung?",
        placeholder: "Tür bleibt geschlossen, Gefahren des Gases, Prioritäten...",
        hint: "FM-200 ist zwar bei korrekter Konzentration für kurze Zeit überlebbar, aber der Sauerstoffgehalt sinkt, Brandgefahr besteht noch, Feuerwehr hat Vorrang.",
      },
      {
        question: "Warum wird in Serverräumen eine Gaslöschanlage statt einer Wassersprinkleranlage eingesetzt? Nennen Sie mindestens drei Gründe.",
        placeholder: "Leitfähigkeit, Hardwareschaden, Löschmittelrückstände, Druckerhöhung...",
      },
      {
        question: "Was muss nach der Gasauslösung zwingend beachtet werden, bevor der Raum wieder betreten werden darf?",
        placeholder: "Lüftung, Sauerstoffmessung, Feuerwehrfreigabe, Atemschutz...",
      },
    ],
    optimalActions: [
      "Serverraum-Tür unter keinen Umständen öffnen — Gaskonzentration muss erhalten bleiben bis Brandbekämpfung abgeschlossen",
      "Mitarbeiter beruhigen: FM-200 ist bei kurzer Exposition ohne Atemschutz begrenzt toxisch, aber Sauerstoffmangel und Brandrestrisiko bestehen",
      "Feuerwehr über erfolgreich ausgelöste Gasanlage und verwendetes Löschmittel informieren",
      "Alle Personen vom Serverraum-Eingang zurückhalten — Sicherheitsabstand einhalten",
      "Gasauslösung mit Uhrzeit im Brandprotokoll dokumentieren",
    ],
    keyTerms: [
      "FM-200", "Novec 1230", "Gaslöschanlage", "kein Wasser", "Sauerstoffgehalt", "Sauerstoffsensor",
      "Tür bleibt geschlossen", "Atemschutz", "Feuerwehr", "Sicherheitsabstand", "Konzentration",
      "Brandprotokoll", "nicht betreten",
    ],
    maxScore: 10,
  },

  // ─── Phase 6: FEUERWEHR ──────────────────────────────────────────────────
  {
    id: 5,
    phase: "FEUERWEHR",
    title: "Feuerwehr-Einweisung mit Laufkarten",
    narrative:
      "02:39 Uhr. Zwei Fahrzeuge der Berufsfeuerwehr rollen auf den Parkplatz. " +
      "Blaulicht füllt die Nacht. Der Einsatzleiter kommt auf Sie zu und fordert sofort: " +
      "'Wo genau brennt es? Gasanlage ausgelöst? Personen im Gebäude? Wo sind die Laufkarten?'\n\n" +
      "Die Feuerwehr-Laufkarten (DIN 14 675) hängen in einem roten Kasten am Gebäudeeingang — " +
      "Grundrisse mit Löschmittelangaben, Sicherheitsdatenblätter für FM-200, " +
      "Standorte der Hauptschalter. Ihr Unternehmen hat diese pflichtgemäß aktuell gehalten. " +
      "Eine Kollegin fragt, ob sie die Serverraum-Tür für die Feuerwehr aufschließen soll. " +
      "Öffnen Sie das Monitoring-Übersichtsterminal für die Lagemeldung.",
    alertLevel: "critical",
    interactiveObjects: ["monitor-main", "monitor-phone", "srv-firewall"],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "offline",
      "srv-monitor": "offline",
      "srv-firewall": "offline",
    },
    objectTrigger: "monitor-main",
    timeLimitSec: 120,
    prompts: [
      {
        question: "Welche Informationen übergeben Sie dem Feuerwehr-Einsatzleiter in den ersten 60 Sekunden (strukturiertes Briefing)?",
        placeholder: "Brandort, Löschmittel, Personen, Gebäudedaten, besondere Gefahren...",
        hint: "METHANE-Schema: Major incident, Exact location, Type of incident, Hazards, Access, Number of casualties, Emergency services required.",
      },
      {
        question: "Was sind Feuerwehr-Laufkarten (DIN 14 675) und welche Informationen müssen darin enthalten sein?",
        placeholder: "Gebäudepläne, Löschmittelstandorte, Gefahrstoffinformationen...",
      },
      {
        question: "Soll die Serverraum-Tür für die Feuerwehr geöffnet werden? Begründen Sie Ihre Empfehlung.",
        placeholder: "Entscheidung und Begründung: Gaskonzentration, Brandstatus, Feuerwehrauftrag...",
        hint: "Das ist allein Entscheidung des Feuerwehr-Einsatzleiters — nicht des IT-Personals.",
      },
    ],
    optimalActions: [
      "Feuerwehr-Laufkarten aus dem roten Kasten aushändigen — enthält alle sicherheitsrelevanten Gebäudedaten",
      "Strukturiertes Briefing: Brandort (Rack B-07), Löschanlage ausgelöst (FM-200), alle Personen evakuiert, elektrischer Brand",
      "Tür-Entscheidung liegt beim Feuerwehr-Einsatzleiter — IT-Personal gibt nur Schlüssel und Informationen",
      "Kontaktdaten des Brandschutzbeauftragten und Gebäudetechnik an Feuerwehr übergeben",
      "Eigene Personen vom Gefahrenbereich fernhalten und Einsatzzone für Feuerwehr freihalten",
    ],
    keyTerms: [
      "Laufkarten", "DIN 14 675", "Einsatzleiter", "Briefing", "FM-200", "Sicherheitsdatenblatt",
      "Grundriss", "Evakuierung abgeschlossen", "Feuerwehr entscheidet", "Brandschutzbeauftragter",
      "Gebäudetechnik", "Gefahrenbereich", "METHANE",
    ],
    maxScore: 10,
  },

  // ─── Phase 7: SCHADENSBEURTEILUNG ────────────────────────────────────────
  {
    id: 6,
    phase: "SCHADENSBEURTEILUNG",
    title: "Wiederbetreten mit PSA – Schadensdokumentation",
    narrative:
      "04:15 Uhr. Der Feuerwehr-Einsatzleiter gibt die Freigabe zum Wiederbetreten des Serverraums. " +
      "'Feuer gelöscht. Gas liegt noch bei 3,2 % — nehmen Sie Atemschutz.' " +
      "Der Objektschutz bringt Halbmasken mit A2-Filterpatronen und Nitril-Handschuhe.\n\n" +
      "Beim Betreten: Brandgeruch, Rußspuren an Rack B-07, die Rückseite des App-Servers ist " +
      "geschmolzen. Rack B-06 (Datenbankserver) zeigt Rußablagerungen, scheint aber äußerlich " +
      "intakt. Rack C-01 (Backup-Server) sieht unberührt aus. " +
      "Die Wärmebildkamera zeigt noch Restwärme bei 42°C an Rack B-07. " +
      "Alles muss fotografiert und dokumentiert werden — für Versicherung, RCA und Behörden. " +
      "Prüfen Sie den Backup-Server auf Zustand.",
    alertLevel: "warning",
    interactiveObjects: ["srv-backup", "srv-db", "monitor-main"],
    serverStatuses: {
      "srv-db": "offline",
      "srv-app": "offline",
      "srv-web": "offline",
      "srv-mail": "offline",
      "srv-backup": "offline",
      "srv-monitor": "offline",
      "srv-firewall": "offline",
    },
    objectTrigger: "srv-backup",
    timeLimitSec: 150,
    prompts: [
      {
        question: "Welche persönliche Schutzausrüstung (PSA) ist beim Wiederbetreten eines Serverraums nach Gasauslösung zwingend erforderlich und warum?",
        placeholder: "Atemschutz, Handschuhe, Schutzkleidung, Messgeräte...",
        hint: "Gasreste, Brandgase, Rußpartikel, Sauerstoffmangel, heiße Oberflächen.",
      },
      {
        question: "Wie priorisieren Sie die Schadensdokumentation? Was wird als Erstes gesichert und wie?",
        placeholder: "Fotos, Thermal-Bilder, schriftliche Notizen, Zeugenaussagen, Reihenfolge...",
      },
      {
        question: "Der Datenbankserver sieht äußerlich intakt aus, stand aber in der Rauchatmosphäre. Wie beurteilen Sie seine Wiedereinsetzbarkeit?",
        placeholder: "Externe Inspektion reicht nicht, Fachprüfung, Reinigung, Testergebnisse...",
        hint: "Ruß und Brandgase können Korrosion in Elektronik auslösen — äußerlich intakt heißt nicht betriebssicher.",
      },
    ],
    optimalActions: [
      "PSA anlegen: Halbmaske mit ABEK-Filter, antistatische Handschuhe, keine offene Flamme",
      "Kontinuierliche Sauerstoffmessung während des gesamten Aufenthalts im Serverraum",
      "Systematische Fotodokumentation: Gesamtansicht, Detailaufnahmen, Seriennummern, Rack-Beschriftungen",
      "Thermal-Kamera-Ergebnisse protokollieren — Restwärme kennzeichnet noch aktive Risikobereiche",
      "Alle Systeme als 'nicht betriebsbereit' kennzeichnen bis zur Fachprüfung durch Hardwarehersteller",
    ],
    keyTerms: [
      "PSA", "Atemschutz", "Halbmaske", "Sauerstoffmessung", "Wärmebildkamera", "Dokumentation",
      "Fotos", "Versicherung", "RCA", "Root Cause Analysis", "Fachprüfung", "Ruß", "Korrosion",
      "Restwärme",
    ],
    maxScore: 10,
  },

  // ─── Phase 8: WIEDERAUFBAU ────────────────────────────────────────────────
  {
    id: 7,
    phase: "WIEDERAUFBAU",
    title: "BCM-Aktivierung, DR-Failover und Brandschutzordnung",
    narrative:
      "07:45 Uhr. Tageslicht. Das Unternehmen erwacht — und stellt fest, dass der Serverraum " +
      "seit 5 Stunden offline ist. Kundenanfragen häufen sich. Der Geschäftsführer hat das " +
      "Business Continuity Management (BCM) aktiviert. Der DR-Standort in Frankfurt übernimmt " +
      "schrittweise die kritischen Services.\n\n" +
      "Aber die Arbeit ist noch lange nicht getan: Wer hat Schuld? War die Brandschutzordnung " +
      "aktuell? Warum war kein CO2-Handfeuerlöscher direkt neben Rack B-07? " +
      "Welche ISO-27001-Kontrollen haben versagt? Wie wird verhindert, dass das wieder passiert? " +
      "Der IT-Leiter fordert einen vollständigen RCA-Bericht bis 14:00 Uhr. " +
      "Starten Sie das Backup-System für den DR-Überblick.",
    alertLevel: "warning",
    interactiveObjects: ["srv-backup", "monitor-main", "monitor-email"],
    serverStatuses: {
      "srv-db": "critical",
      "srv-app": "offline",
      "srv-web": "critical",
      "srv-mail": "warning",
      "srv-backup": "warning",
      "srv-monitor": "warning",
      "srv-firewall": "healthy",
    },
    objectTrigger: "srv-backup",
    timeLimitSec: null,
    prompts: [
      {
        question: "Beschreiben Sie die Aktivierung des DR-Failovers: Welche Systeme werden in welcher Prioritätsreihenfolge am DR-Standort wiederhergestellt?",
        placeholder: "Kritische Systeme zuerst, RTO/RPO, Reihenfolge, Testverfahren...",
        hint: "Firewall/Netzwerk → Datenbank (Read-only) → Web/App → Mail → Monitoring. RTO aus BCP prüfen.",
      },
      {
        question: "Welche Änderungen an der Brandschutzordnung (DIN 14 096) und den physischen Sicherheitsmaßnahmen empfehlen Sie nach diesem Vorfall?",
        placeholder: "Löscher-Standorte, VESDA-Kalibrierung, Schulungen, Notfallübungen, Änderungen...",
      },
      {
        question: "Welche ISO-27001-Kontrollen aus Annex A sind durch diesen Vorfall relevant, und wie wird das im ISMS dokumentiert?",
        placeholder: "A.7.5 physischer Schutz, A.8.1 Medienmanagement, A.17 Notfallmanagement, Korrekturmaßnahmen...",
        hint: "ISO 27001:2022 Annex A.7.5 (Schutz vor physischen Bedrohungen), A.8.9 (Konfigurationsmanagement), A.5.29 (Informationssicherheit bei Unterbrechungen).",
      },
    ],
    optimalActions: [
      "BCM-Plan aktivieren: DR-Failover nach definierter RTO-Prioritätsliste (Firewall → DB → Web → Mail)",
      "Root Cause Analysis (RCA) einleiten: 5-Why-Methode, Zeitstrahl des Vorfalls, beteiligte Systeme",
      "Brandschutzordnung gemäß DIN 14 096 überarbeiten: Löschermittel prüfen, Wartungsintervalle, Schulungsplan",
      "ISMS-Korrekturmaßnahmen dokumentieren: ISO 27001 Clause 10.1 (Nichtkonformitäten und Korrekturmaßnahmen)",
      "Lessons-Learned-Workshop mit allen Beteiligten ansetzen und Ergebnisse ins Notfallhandbuch einfließen lassen",
    ],
    keyTerms: [
      "BCM", "DR-Failover", "RTO", "RPO", "Root Cause Analysis", "RCA", "Brandschutzordnung",
      "DIN 14 096", "ISO 27001", "Annex A", "Korrekturmaßnahmen", "Lessons Learned", "Notfallhandbuch",
      "5-Why", "Clause 10", "A.7.5", "Nichtkonformität",
    ],
    maxScore: 10,
  },
];

export const SERVER_FIRE_META = {
  title: "Serverraum-Brand",
  category: "physical",
  estimatedMinutes: 25,
  phaseCount: 8,
};

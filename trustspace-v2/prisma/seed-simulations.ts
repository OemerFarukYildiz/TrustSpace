import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const scenarios = [
  // ─── SCENARIO 1: RANSOMWARE ────────────────────────────────────────────────
  {
    id: 'sim-scenario-ransomware',
    code: 'SIM-RANSOMWARE-001',
    title: 'Ransomware-Angriff',
    description:
      'Ein Ransomware-Angriff trifft Ihre Organisation. Wie reagieren Sie richtig? ' +
      'Testen Sie Ihre Kenntnisse in Incident Response, Meldepflichten und Recovery.',
    category: 'cyber',
    difficulty: 'medium',
    estimatedMinutes: 25,
    decisionTree: JSON.stringify({
      meta: {
        totalScenes: 7,
        maxPossibleScore: 70,
        placeholders: ['{{ISB_NAME}}', '{{IT_LEITER}}'],
      },
      scenes: [
        {
          id: 0,
          title: 'Erster Alarm',
          narrative:
            'Montagmorgen, 08:15 Uhr. Ein Mitarbeiter meldet sich panisch: ' +
            'Alle Dateien auf seinem Rechner sind verschlüsselt und eine Lösegeldforderung erscheint auf dem Bildschirm. ' +
            'Der Betrag: 50.000 USD in Bitcoin, Frist 48 Stunden.',
          illustration: 'shield-alert',
          timeLimitSec: 120,
          freeTextPrompt: 'Wen informieren Sie als erstes und warum?',
          choices: [
            {
              id: '0-a',
              text: 'Sofort die IT-Abteilung ({{IT_LEITER}}) und den ISB ({{ISB_NAME}}) alarmieren',
              score: 10,
              feedback:
                'Richtig! Die sofortige Information von IT und ISB ist entscheidend. ' +
                'Jede Minute zählt, um die Ausbreitung zu stoppen.',
              nextScene: 1,
              isOptimal: true,
            },
            {
              id: '0-b',
              text: 'Den befallenen Rechner sofort herunterfahren',
              score: 7,
              feedback:
                'Teilweise richtig. Das Abschalten kann die Verschlüsselung stoppen, ' +
                'aber ohne vorherige Benachrichtigung der IT fehlt die koordinierte Response. ' +
                'Außerdem können Forensik-Daten verloren gehen.',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-c',
              text: 'Erst googeln, ob es bekannte Entschlüsselungstools für diese Ransomware gibt',
              score: 2,
              feedback:
                'Das Zeitverschwenden mit Recherchen verschlimmert die Lage. ' +
                'Die Ransomware verbreitet sich weiter im Netzwerk.',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-d',
              text: 'Den Vorfall zunächst ignorieren und beobachten, ob weitere Meldungen kommen',
              score: 0,
              feedback:
                'Fataler Fehler! Jede Minute ohne Reaktion gibt der Ransomware mehr Zeit, ' +
                'sich im Netzwerk auszubreiten und weitere Systeme zu befallen.',
              nextScene: 1,
              isOptimal: false,
            },
          ],
        },
        {
          id: 1,
          title: 'Eindämmung',
          narrative:
            'Die IT-Abteilung ist informiert. Erste Analyse zeigt: Die Ransomware ' +
            'hat sich bereits auf 3 weitere Arbeitsplätze ausgebreitet und versucht, ' +
            'auf den Fileserver zuzugreifen. Was ist die nächste Priorität?',
          illustration: 'server-crash',
          timeLimitSec: 90,
          choices: [
            {
              id: '1-a',
              text: 'Betroffene Systeme sofort vom Netzwerk trennen (Netzwerkkabel ziehen / WLAN deaktivieren)',
              score: 10,
              feedback:
                'Korrekte Containment-Maßnahme! Das Isolieren befallener Systeme ' +
                'verhindert die weitere Ausbreitung und schützt noch nicht befallene Assets.',
              nextScene: 2,
              isOptimal: true,
            },
            {
              id: '1-b',
              text: 'Antivirus-Scan auf allen Systemen starten',
              score: 5,
              feedback:
                'Ein AV-Scan ist sinnvoll, aber nicht die erste Priorität. ' +
                'Ohne Netzwerktrennung verbreitet sich die Ransomware während des Scans weiter.',
              nextScene: 2,
              isOptimal: false,
            },
            {
              id: '1-c',
              text: 'Zunächst alle Backups prüfen, ob sie noch intakt sind',
              score: 7,
              feedback:
                'Backup-Prüfung ist wichtig, aber erst nach der Eindämmung. ' +
                'Ohne Netzwerktrennung riskieren Sie, dass auch Backups verschlüsselt werden.',
              nextScene: 2,
              isOptimal: false,
            },
            {
              id: '1-d',
              text: 'Den gesamten Unternehmensbetrieb einstellen bis zur Klärung',
              score: 3,
              feedback:
                'Eine vollständige Betriebsunterbrechung ist unverhältnismäßig. ' +
                'Gezielte Eindämmung befallener Systeme ist der richtige Ansatz.',
              nextScene: 2,
              isOptimal: false,
            },
          ],
        },
        {
          id: 2,
          title: 'Schadensbewertung',
          narrative:
            'Die betroffenen Systeme sind isoliert. Jetzt brauchen Sie eine Übersicht: ' +
            '12 Arbeitsplätze verschlüsselt, der Fileserver teilweise betroffen, ' +
            'das Backup-System scheint intakt. Die Geschäftsführung fragt nach dem Ausmaß.',
          illustration: 'database',
          timeLimitSec: null,
          choices: [
            {
              id: '2-a',
              text: 'Strukturierte forensische Analyse: welche Systeme betroffen, welche Daten verschlüsselt, wann begann der Angriff?',
              score: 10,
              feedback:
                'Professionelle Vorgehensweise! Eine strukturierte Analyse liefert ' +
                'die Basis für alle weiteren Entscheidungen und ist für spätere Meldungen essenziell.',
              nextScene: 3,
              isOptimal: true,
            },
            {
              id: '2-b',
              text: 'Grobe Schätzung an die Geschäftsführung senden und direkt mit der Wiederherstellung beginnen',
              score: 5,
              feedback:
                'Der Wunsch, schnell zu handeln ist verständlich, aber ohne solide ' +
                'Schadensübersicht riskieren Sie unvollständige Wiederherstellung und Lücken im Incident Report.',
              nextScene: 3,
              isOptimal: false,
            },
            {
              id: '2-c',
              text: 'Einen externen IT-Forensiker beauftragen, bevor man selbst etwas anfasst',
              score: 8,
              feedback:
                'Gut gedacht für die spätere Beweissicherung. In zeitkritischen Situationen ' +
                'sollte jedoch das eigene Team parallel bereits erste Analysen durchführen.',
              nextScene: 3,
              isOptimal: false,
            },
          ],
        },
        {
          id: 3,
          title: 'Meldepflichten DSGVO',
          narrative:
            'Die Analyse ergibt: Kundendaten (Name, E-Mail, teilweise Zahlungsdaten) ' +
            'könnten kompromittiert sein – der Angreifer hatte vor der Verschlüsselung ' +
            'möglicherweise Zugriff. Was sind Ihre Pflichten?',
          illustration: 'shield-alert',
          timeLimitSec: 60,
          choices: [
            {
              id: '3-a',
              text: 'Datenschutzbehörde innerhalb von 72 Stunden melden und betroffene Kunden benachrichtigen',
              score: 10,
              feedback:
                'Korrekt! Art. 33 DSGVO verlangt die Meldung bei der Aufsichtsbehörde ' +
                'binnen 72 Stunden. Bei hohem Risiko für Betroffene gilt auch die ' +
                'Benachrichtigungspflicht nach Art. 34 DSGVO.',
              nextScene: 4,
              isOptimal: true,
            },
            {
              id: '3-b',
              text: 'Erst nach vollständiger interner Aufklärung melden – man möchte keine Fehlinformationen verbreiten',
              score: 3,
              feedback:
                'Die 72-Stunden-Frist läuft bereits! Eine spätere Meldung mit allen Details ' +
                'ist zwar möglich, aber die Erstmeldung muss fristgerecht erfolgen, auch wenn ' +
                'noch nicht alle Fakten bekannt sind.',
              nextScene: 4,
              isOptimal: false,
            },
            {
              id: '3-c',
              text: 'Datenpanne intern dokumentieren, aber keine externe Meldung – man will Reputationsschäden vermeiden',
              score: 0,
              feedback:
                'Schwerwiegender Compliance-Verstoß! Die unterlassene Meldung kann Bußgelder ' +
                'bis zu 10 Mio. EUR oder 2% des Jahresumsatzes bedeuten, ganz abgesehen vom ' +
                'Vertrauensverlust, wenn es später herauskommt.',
              nextScene: 4,
              isOptimal: false,
            },
            {
              id: '3-d',
              text: 'BSI und Datenschutzbehörde informieren und gleichzeitig Strafanzeige erstatten',
              score: 8,
              feedback:
                'Sehr vollständig! BSI-Meldung ist bei kritischen Infrastrukturen Pflicht. ' +
                'Die Strafanzeige ist empfehlenswert, aber zunächst hat die Datenschutzmeldung Priorität.',
              nextScene: 4,
              isOptimal: false,
            },
          ],
        },
        {
          id: 4,
          title: 'Lösegeld-Entscheidung',
          narrative:
            'Die Angreifer erhöhen den Druck: In 12 Stunden verdoppelt sich der Betrag. ' +
            'Das Backup vom Wochenende ist vorhanden, aber die Wiederherstellung ' +
            'dauert schätzungsweise 3 Tage. Die Geschäftsführung fragt, ob man zahlen soll.',
          illustration: 'shield-alert',
          timeLimitSec: null,
          choices: [
            {
              id: '4-a',
              text: 'Lösegeld NICHT zahlen – Wiederherstellung aus Backup einleiten, BSI kontaktieren',
              score: 10,
              feedback:
                'Die richtige Entscheidung! Lösegeld-Zahlung finanziert Kriminelle, ' +
                'garantiert keine vollständige Entschlüsselung und macht Sie zum wiederholten Ziel. ' +
                'Das BSI empfiehlt ausdrücklich, nicht zu zahlen.',
              nextScene: 5,
              isOptimal: true,
            },
            {
              id: '4-b',
              text: 'Lösegeld zahlen – die Betriebsunterbrechung ist zu kostspielig',
              score: 2,
              feedback:
                'Wirtschaftlich nachvollziehbar, aber strategisch falsch. ' +
                'Ca. 40% aller zahlenden Opfer erhalten die Daten nicht zurück. ' +
                'Zudem sind Sie jetzt als zahlungswillig bekannt.',
              nextScene: 5,
              isOptimal: false,
            },
            {
              id: '4-c',
              text: 'Verhandeln, um Zeit zu gewinnen, während parallel die Wiederherstellung läuft',
              score: 7,
              feedback:
                'Taktisch vertretbar, um Zeit zu kaufen. Keine Zahlungszusagen machen! ' +
                'Der Fokus sollte auf der Wiederherstellung aus Backups liegen.',
              nextScene: 5,
              isOptimal: false,
            },
          ],
        },
        {
          id: 5,
          title: 'Wiederherstellung',
          narrative:
            'Die Wiederherstellung aus dem Backup läuft. Jetzt müssen Sie sicherstellen, ' +
            'dass die Systeme sicher wiederhergestellt werden und der gleiche Angriffsvektor ' +
            'nicht nochmal ausgenutzt werden kann.',
          illustration: 'server-crash',
          timeLimitSec: null,
          choices: [
            {
              id: '5-a',
              text: 'Systeme aus sauberem Backup wiederherstellen, Angriffsvektor (z.B. Phishing-Mail) identifizieren und schließen, alle Passwörter zurücksetzen',
              score: 10,
              feedback:
                'Vollständige und korrekte Recovery-Vorgehensweise! Ohne Schließung des ' +
                'Angriffsvektors würden Sie nach der Wiederherstellung sofort wieder befallen.',
              nextScene: 6,
              isOptimal: true,
            },
            {
              id: '5-b',
              text: 'Systeme wiederherstellen und sofort wieder in Betrieb nehmen',
              score: 4,
              feedback:
                'Zu schnell! Ohne Identifikation und Schließung des Angriffsvektors riskieren Sie ' +
                'eine sofortige Reinfektion. Auch Passwort-Reset wird häufig vergessen.',
              nextScene: 6,
              isOptimal: false,
            },
            {
              id: '5-c',
              text: 'Alle Systeme neu aufsetzen (Clean Install) – kein Backup nutzen, da es ggf. kompromittiert ist',
              score: 7,
              feedback:
                'Sicherste Option, aber zeitaufwändiger. Wenn Backups aus der Zeit vor dem Angriff ' +
                'stammen und sauber sind, ist die Wiederherstellung vertretbar.',
              nextScene: 6,
              isOptimal: false,
            },
          ],
        },
        {
          id: 6,
          title: 'Lessons Learned',
          narrative:
            'Die Systeme sind wiederhergestellt, der Betrieb läuft wieder. ' +
            'Jetzt ist der richtige Zeitpunkt für eine Post-Incident-Analyse. ' +
            'Was sind die wichtigsten Maßnahmen, um zukünftige Angriffe zu verhindern?',
          illustration: 'shield-alert',
          timeLimitSec: null,
          choices: [
            {
              id: '6-a',
              text: 'Strukturiertes Post-Mortem: Angriffsvektor dokumentieren, Awareness-Training für Mitarbeiter, Backup-Strategie überprüfen, Incident Response Plan aktualisieren',
              score: 10,
              feedback:
                'Exzellent! Ein strukturiertes Lessons-Learned stellt sicher, dass die Organisation ' +
                'aus dem Vorfall lernt und besser auf zukünftige Angriffe vorbereitet ist.',
              nextScene: 'end',
              isOptimal: true,
            },
            {
              id: '6-b',
              text: 'Bessere Antivirus-Software kaufen',
              score: 3,
              feedback:
                'Technische Tools sind wichtig, aber allein nicht ausreichend. ' +
                'Ohne Awareness-Training, verbesserte Backup-Strategie und aktualisierte Prozesse ' +
                'bleibt die Organisation verwundbar.',
              nextScene: 'end',
              isOptimal: false,
            },
            {
              id: '6-c',
              text: 'Den Vorfall intern ad acta legen – man möchte keine schlechte Stimmung erzeugen',
              score: 0,
              feedback:
                'Verpasste Chance! Ohne Aufarbeitung wiederholen sich die gleichen Fehler. ' +
                'Außerdem ist eine interne Dokumentation für Compliance-Nachweise und spätere ' +
                'Audits unerlässlich.',
              nextScene: 'end',
              isOptimal: false,
            },
          ],
        },
      ],
    }),
  },

  // ─── SCENARIO 2: SERVERRAUM-BRAND ─────────────────────────────────────────
  {
    id: 'sim-scenario-fire',
    code: 'SIM-FIRE-001',
    title: 'Serverraum-Brand',
    description:
      'Ein Brand im Serverraum bedroht Ihre IT-Infrastruktur. ' +
      'Testen Sie Ihre Kenntnisse in physischer Sicherheit und Business Continuity.',
    category: 'physical',
    difficulty: 'easy',
    estimatedMinutes: 15,
    decisionTree: JSON.stringify({
      meta: {
        totalScenes: 6,
        maxPossibleScore: 60,
        placeholders: ['{{BRANDSCHUTZBEAUFTRAGTER}}', '{{SERVERRAUM_STANDORT}}'],
      },
      scenes: [
        {
          id: 0,
          title: 'Feueralarm',
          narrative:
            'Es ist 14:30 Uhr. Der Feueralarm im Gebäude geht los. ' +
            'Rauch dringt aus dem Serverraum {{SERVERRAUM_STANDORT}} im UG. ' +
            'Sie sind der diensthabende IT-Verantwortliche.',
          illustration: 'flame',
          timeLimitSec: 60,
          choices: [
            {
              id: '0-a',
              text: 'Gebäude sofort evakuieren, Feuerwehr rufen (112), {{BRANDSCHUTZBEAUFTRAGTER}} informieren',
              score: 10,
              feedback:
                'Richtig! Menschenleben haben absoluten Vorrang. ' +
                'Erst evakuieren, dann alarmieren – nie selbst löschen ohne Ausbildung.',
              nextScene: 1,
              isOptimal: true,
            },
            {
              id: '0-b',
              text: 'Schnell in den Serverraum gehen und selbst mit dem Feuerlöscher löschen',
              score: 2,
              feedback:
                'Lebensgefährlich! Serverraum-Brände können giftige Gase freisetzen. ' +
                'Ohne Atemschutz niemals in verrauchte Räume. Feuerwehr abwarten!',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-c',
              text: 'Zunächst die Server ordnungsgemäß herunterfahren, dann evakuieren',
              score: 1,
              feedback:
                'Falsche Priorität! IT-Equipment ist ersetzbar, Menschenleben nicht. ' +
                'Sofortige Evakuierung hat absoluten Vorrang.',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-d',
              text: 'Prüfen, ob es wirklich brennt – vielleicht nur Fehlalarm',
              score: 4,
              feedback:
                'Verständlicher Gedanke, aber ein Fehlalarm ist immer noch besser als ein ' +
                'versäumtes Feuer. Im Zweifelsfall immer evakuieren.',
              nextScene: 1,
              isOptimal: false,
            },
          ],
        },
        {
          id: 1,
          title: 'Brandbekämpfung',
          narrative:
            'Das Gebäude ist evakuiert, die Feuerwehr ist unterwegs. ' +
            'Das Brandschutzsystem des Serverraums hat angesprochen. ' +
            'Was tun Sie jetzt?',
          illustration: 'flame',
          timeLimitSec: null,
          choices: [
            {
              id: '1-a',
              text: 'Auf die Feuerwehr warten, IT-Notfallplan aktivieren, Management informieren',
              score: 10,
              feedback:
                'Korrekte Vorgehensweise! Parallel zur Brandbekämpfung durch die Feuerwehr ' +
                'können bereits die Wiederherstellungsmaßnahmen eingeleitet werden.',
              nextScene: 2,
              isOptimal: true,
            },
            {
              id: '1-b',
              text: 'Versuchen, wichtige Hardware vor den Flammen zu retten',
              score: 1,
              feedback:
                'Lebensgefährlich und verboten! Das Betreten des Brandbereichs ist der ' +
                'Feuerwehr vorbehalten. Hardware ist ersetzbar.',
              nextScene: 2,
              isOptimal: false,
            },
            {
              id: '1-c',
              text: 'Strom im gesamten Gebäude abschalten',
              score: 7,
              feedback:
                'Das kann sinnvoll sein, um die Brandausbreitung zu begrenzen, aber nur ' +
                'in Absprache mit der Feuerwehr. Eine unkontrollierte Abschaltung kann auch ' +
                'Probleme verursachen.',
              nextScene: 2,
              isOptimal: false,
            },
          ],
        },
        {
          id: 2,
          title: 'Schadensbewertung nach dem Brand',
          narrative:
            'Der Brand ist gelöscht. Die Feuerwehr gibt den Bereich frei. ' +
            'Erste Einschätzung: 4 Server total zerstört, 2 möglicherweise noch funktionsfähig. ' +
            'Wie gehen Sie vor?',
          illustration: 'server-crash',
          timeLimitSec: null,
          choices: [
            {
              id: '2-a',
              text: 'Strukturierte Schadensdokumentation für Versicherung, IT-Forensik und Sachverständigen beauftragen, noch funktionierende Server nicht voreilig einschalten',
              score: 10,
              feedback:
                'Professionell! Die Dokumentation ist entscheidend für Versicherungsansprüche. ' +
                'Beschädigte Hardware sollte erst nach Expertenbegutachtung eingeschaltet werden.',
              nextScene: 3,
              isOptimal: true,
            },
            {
              id: '2-b',
              text: 'Noch funktionierende Server sofort einschalten und Betrieb wiederherstellen',
              score: 3,
              feedback:
                'Zu voreilig! Durch Hitze oder Löschmittel beschädigte Hardware kann beim ' +
                'Einschalten vollständig ausfallen oder Daten zerstören.',
              nextScene: 3,
              isOptimal: false,
            },
            {
              id: '2-c',
              text: 'Alles fotografieren und dann aufräumen',
              score: 6,
              feedback:
                'Fotos sind gut, aber nicht ausreichend. Ein professioneller Sachverständiger ' +
                'und IT-Forensiker sollten den Schaden begutachten.',
              nextScene: 3,
              isOptimal: false,
            },
          ],
        },
        {
          id: 3,
          title: 'Business Continuity',
          narrative:
            'Der Serverraum ist für mindestens 2 Wochen gesperrt. ' +
            'Kritische Geschäftsprozesse stehen still. Wie aktivieren Sie Business Continuity?',
          illustration: 'database',
          timeLimitSec: null,
          choices: [
            {
              id: '3-a',
              text: 'Business Continuity Plan (BCP) aktivieren: Ausweichstandort nutzen, Cloud-Failover aktivieren, kritische Prozesse priorisieren',
              score: 10,
              feedback:
                'Genau richtig! Ein gut vorbereiteter BCP stellt sicher, dass die wichtigsten ' +
                'Geschäftsprozesse auch während eines Notfalls aufrechterhalten werden können.',
              nextScene: 4,
              isOptimal: true,
            },
            {
              id: '3-b',
              text: 'Neue Server bestellen und auf deren Lieferung warten',
              score: 3,
              feedback:
                'Ohne BCP bedeutet das 1-2 Wochen kompletten Stillstand. ' +
                'Bei kritischen Prozessen ist das inakzeptabel.',
              nextScene: 4,
              isOptimal: false,
            },
            {
              id: '3-c',
              text: 'Mitarbeiter ins Homeoffice schicken und auf Cloud-Dienste ausweichen',
              score: 7,
              feedback:
                'Pragmatischer Ansatz, aber ohne strukturierten BCP fehlt die Koordination. ' +
                'Welche Dienste sind kritisch? Wer hat auf was Zugriff?',
              nextScene: 4,
              isOptimal: false,
            },
          ],
        },
        {
          id: 4,
          title: 'Versicherung und rechtliche Aspekte',
          narrative:
            'Die Versicherung fragt nach dem Brandschutzkonzept und dem ' +
            'IT-Sicherheitskonzept. Außerdem: Müssen Sie Behörden informieren?',
          illustration: 'shield-alert',
          timeLimitSec: null,
          choices: [
            {
              id: '4-a',
              text: 'Versicherung vollständig informieren, falls personenbezogene Daten betroffen: Datenschutzbehörde melden, Dokumentation bereitstellen',
              score: 10,
              feedback:
                'Vollständig korrekt! Wenn durch den Brand personenbezogene Daten verloren gehen ' +
                'oder unbefugt zugänglich werden, greift die DSGVO-Meldepflicht.',
              nextScene: 5,
              isOptimal: true,
            },
            {
              id: '4-b',
              text: 'Nur die Versicherung informieren, der Rest ist intern',
              score: 5,
              feedback:
                'Unvollständig. Bei Verlust oder Exposition personenbezogener Daten ' +
                'besteht eine DSGVO-Meldepflicht.',
              nextScene: 5,
              isOptimal: false,
            },
            {
              id: '4-c',
              text: 'Nichts melden – erst alle Fakten klären',
              score: 1,
              feedback:
                'Die 72-Stunden-Frist der DSGVO läuft! Und die Versicherung kann bei ' +
                'verspäteter Meldung die Leistung verweigern.',
              nextScene: 5,
              isOptimal: false,
            },
          ],
        },
        {
          id: 5,
          title: 'Prävention für die Zukunft',
          narrative:
            'Der Betrieb ist wiederhergestellt. Was unternehmen Sie, um einen ' +
            'ähnlichen Vorfall in Zukunft zu verhindern oder besser darauf vorbereitet zu sein?',
          illustration: 'flame',
          timeLimitSec: null,
          choices: [
            {
              id: '5-a',
              text: 'Brandschutzkonzept überprüfen, Backup-Strategie auf 3-2-1-Regel umstellen, BCP testen, Mitarbeiter schulen',
              score: 10,
              feedback:
                'Umfassende und richtige Maßnahmen! Die 3-2-1-Backup-Regel (3 Kopien, 2 Medien, ' +
                '1 offsite) schützt Daten auch bei physischen Schäden.',
              nextScene: 'end',
              isOptimal: true,
            },
            {
              id: '5-b',
              text: 'Eine bessere Klimaanlage installieren lassen',
              score: 2,
              feedback:
                'Überhitzung ist ein möglicher Brandgrund, aber die Maßnahme ist zu eng gefasst. ' +
                'Ein umfassendes Sicherheitskonzept ist notwendig.',
              nextScene: 'end',
              isOptimal: false,
            },
            {
              id: '5-c',
              text: 'In eine Cyberversicherung mit Sachschadenkomponente investieren',
              score: 6,
              feedback:
                'Versicherungen sind wichtig, ersetzen aber keine präventiven Maßnahmen. ' +
                'Prävention ist immer günstiger als Schadensregulierung.',
              nextScene: 'end',
              isOptimal: false,
            },
          ],
        },
      ],
    }),
  },

  // ─── SCENARIO 3: DATA BREACH / DARK WEB ───────────────────────────────────
  {
    id: 'sim-scenario-databreach',
    code: 'SIM-DATABREACH-001',
    title: 'Datenpanne – Kundendaten im Dark Web',
    description:
      'Ihr Threat-Intelligence-Tool meldet Kundendaten im Dark Web. ' +
      'Testen Sie Ihr Wissen zu DSGVO-Meldepflichten, forensischer Analyse und Krisenkommunikation.',
    category: 'data',
    difficulty: 'hard',
    estimatedMinutes: 35,
    decisionTree: JSON.stringify({
      meta: {
        totalScenes: 8,
        maxPossibleScore: 80,
        placeholders: ['{{DSB_NAME}}', '{{AUFSICHTSBEHOERDE}}'],
      },
      scenes: [
        {
          id: 0,
          title: 'Dark-Web-Fund',
          narrative:
            'Ihr Threat Intelligence Tool meldet um 09:42 Uhr: ' +
            'Kundendaten Ihrer Organisation – darunter Namen, E-Mail-Adressen und ' +
            'gehashte Passwörter von ca. 15.000 Kunden – wurden in einem Dark-Web-Forum entdeckt. ' +
            'Der Datensatz stammt wohl aus einer unbekannten Quelle.',
          illustration: 'database',
          timeLimitSec: 90,
          freeTextPrompt: 'Welche erste Information benötigen Sie, um den Umfang der Datenpanne einzuschätzen?',
          choices: [
            {
              id: '0-a',
              text: 'Sofort internen Incident Response Prozess aktivieren: DSB ({{DSB_NAME}}), IT-Security und Management informieren',
              score: 10,
              feedback:
                'Richtig! Die 72-Stunden-Uhr für die DSGVO-Meldung beginnt ab dem Moment, ' +
                'an dem Sie von der Datenpanne Kenntnis erlangen.',
              nextScene: 1,
              isOptimal: true,
            },
            {
              id: '0-b',
              text: 'Die Daten herunterladen und prüfen, ob sie wirklich von Ihrer Organisation stammen',
              score: 2,
              feedback:
                'Das Herunterladen von Daten aus dem Dark Web ist rechtlich problematisch ' +
                'und technisch riskant (Malware). Stattdessen: Kontext analysieren und ' +
                'interne Systeme prüfen.',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-c',
              text: 'Zunächst abwarten und beobachten, ob weitere Informationen auftauchen',
              score: 0,
              feedback:
                'Die 72-Stunden-Frist läuft! Jede Stunde Verzögerung ohne Handeln ' +
                'verschlimmert die Compliance-Situation.',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-d',
              text: 'Kunden sofort per E-Mail warnen',
              score: 4,
              feedback:
                'Gut gemeint, aber zu früh. Ohne interne Analyse wissen Sie noch nicht, ' +
                'welche Kunden genau betroffen sind und was sie tun sollen.',
              nextScene: 1,
              isOptimal: false,
            },
          ],
        },
        {
          id: 1,
          title: 'Ursachenforschung',
          narrative:
            'Der DSB und die IT-Security sind informiert. Nun muss die Quelle der Datenpanne ' +
            'identifiziert werden. Die Daten entsprechen dem Format Ihrer Kundendatenbank ' +
            'aus dem Jahr 2023. Was sind die möglichen Quellen?',
          illustration: 'database',
          timeLimitSec: null,
          choices: [
            {
              id: '1-a',
              text: 'Systematische Log-Analyse: Datenbankzugriffe 2023 auswerten, ehemalige Mitarbeiter prüfen, API-Logs analysieren, Drittanbieter-Zugriffe bewerten',
              score: 10,
              feedback:
                'Richtige forensische Methodik! Eine systematische Analyse deckt alle ' +
                'möglichen Vektoren ab: Insider-Bedrohungen, externe Angriffe und Supply-Chain-Risiken.',
              nextScene: 2,
              isOptimal: true,
            },
            {
              id: '1-b',
              text: 'Alle aktuellen Mitarbeiter befragen',
              score: 4,
              feedback:
                'Befragungen können hilfreich sein, aber ohne technische Log-Analyse ' +
                'fehlen die harten Fakten. Außerdem schrecken Sie möglicherweise interne Täter.',
              nextScene: 2,
              isOptimal: false,
            },
            {
              id: '1-c',
              text: 'Externen Penetrationstester beauftragen, die aktuelle Infrastruktur zu testen',
              score: 6,
              feedback:
                'Sinnvoll für die Zukunft, aber der Pentest hilft nicht bei der Aufklärung ' +
                'der vergangenen Datenpanne. Historische Logs sind wichtiger.',
              nextScene: 2,
              isOptimal: false,
            },
          ],
        },
        {
          id: 2,
          title: 'Umfang der Datenpanne bestimmen',
          narrative:
            'Die Log-Analyse zeigt: Vor 14 Monaten hatte ein nicht mehr aktiver ' +
            'Dienstleister-Account ungewöhnlich hohe Datenbankabfragen. ' +
            'Der Account hätte längst deaktiviert werden sollen.',
          illustration: 'database',
          timeLimitSec: null,
          choices: [
            {
              id: '2-a',
              text: 'Account sofort sperren, alle Aktionen des Accounts dokumentieren, Dienstleister konfrontieren und rechtliche Schritte prüfen',
              score: 10,
              feedback:
                'Vollständig richtig! Der Account-Missbrauch kann sowohl fahrlässig als auch ' +
                'vorsätzlich sein. Rechtliche Sicherung der Beweise ist wichtig.',
              nextScene: 3,
              isOptimal: true,
            },
            {
              id: '2-b',
              text: 'Den Dienstleister sofort telefonisch konfrontieren',
              score: 5,
              feedback:
                'Ohne vorherige Dokumentation und Account-Sperrung riskieren Sie Beweisvernichtung ' +
                'und ermöglichen weiteren Datenzugriff.',
              nextScene: 3,
              isOptimal: false,
            },
            {
              id: '2-c',
              text: 'Den Account zunächst weiter beobachten, um mehr Beweise zu sammeln',
              score: 3,
              feedback:
                'Gefährlich! Solange der Account aktiv ist, können weitere Daten abfließen.',
              nextScene: 3,
              isOptimal: false,
            },
          ],
        },
        {
          id: 3,
          title: 'DSGVO-Meldung vorbereiten',
          narrative:
            'Es ist nun T+18 Stunden. Sie haben 15.285 betroffene Kundendatensätze identifiziert. ' +
            'Die Datenschutzbehörde ({{AUFSICHTSBEHOERDE}}) muss informiert werden. ' +
            'Was enthält die Meldung?',
          illustration: 'shield-alert',
          timeLimitSec: 60,
          choices: [
            {
              id: '3-a',
              text: 'Art der Verletzung, Kategorien und ungefähre Anzahl betroffener Personen, mögliche Folgen, ergriffene und geplante Maßnahmen – auch unvollständige Meldung fristgerecht senden',
              score: 10,
              feedback:
                'Korrekt nach Art. 33 DSGVO! Eine unvollständige, aber fristgerechte Meldung ' +
                'ist besser als eine verspätete vollständige. Fehlende Infos können nachgereicht werden.',
              nextScene: 4,
              isOptimal: true,
            },
            {
              id: '3-b',
              text: 'Warten bis alle Details bekannt sind – eine unvollständige Meldung macht einen schlechten Eindruck',
              score: 2,
              feedback:
                'Fehler! Die 72-Stunden-Frist ist verbindlich. Verspätete Meldung kann zu ' +
                'Bußgeldern führen, auch wenn die Meldung dann vollständiger wäre.',
              nextScene: 4,
              isOptimal: false,
            },
            {
              id: '3-c',
              text: 'Nur die notwendigsten Informationen melden, um keine schlafenden Hunde zu wecken',
              score: 4,
              feedback:
                'Unvollständige Meldungen werden nachverfolgt. Transparenz ist hier die beste Strategie.',
              nextScene: 4,
              isOptimal: false,
            },
          ],
        },
        {
          id: 4,
          title: 'Betroffene Kunden informieren',
          narrative:
            'Die Behörde ist informiert. Nun müssen Sie 15.285 Kunden benachrichtigen. ' +
            'Die gehashten Passwörter könnten durch Brute-Force angegriffen werden. ' +
            'Was kommunizieren Sie?',
          illustration: 'shield-alert',
          timeLimitSec: null,
          choices: [
            {
              id: '4-a',
              text: 'Klare, verständliche E-Mail: was passiert ist, welche Daten betroffen, konkretes Handlungsempfehlung (Passwort ändern), Kontaktmöglichkeit für Fragen',
              score: 10,
              feedback:
                'Vorbildliche Krisenkommunikation! Kunden schätzen Transparenz und ' +
                'konkrete Handlungsempfehlungen. Panik entsteht eher durch Unklarheit.',
              nextScene: 5,
              isOptimal: true,
            },
            {
              id: '4-b',
              text: 'Allgemeine E-Mail: "Wir haben Kenntnis von einem Sicherheitsvorfall und arbeiten daran"',
              score: 3,
              feedback:
                'Zu vage! Kunden können nicht beurteilen, ob sie handeln müssen. ' +
                'Art. 34 DSGVO verlangt klare Beschreibung des Vorfalls.',
              nextScene: 5,
              isOptimal: false,
            },
            {
              id: '4-c',
              text: 'Gar nicht kommunizieren – die Benachrichtigung könnte Reputationsschäden verursachen',
              score: 0,
              feedback:
                'Datenschutzrechtlich unzulässig bei hohem Risiko für Betroffene. ' +
                'Und wenn es herauskommt, ist der Reputationsschaden um ein Vielfaches größer.',
              nextScene: 5,
              isOptimal: false,
            },
          ],
        },
        {
          id: 5,
          title: 'Technische Sofortmaßnahmen',
          narrative:
            'Während Sie kommunizieren, muss die IT gleichzeitig technische Maßnahmen ergreifen. ' +
            'Die betroffenen Passwörter sind gehasht (bcrypt), aber noch unsicherer Hash-Algorithmus (MD5) ' +
            'wurde für ältere Accounts genutzt.',
          illustration: 'server-crash',
          timeLimitSec: null,
          choices: [
            {
              id: '5-a',
              text: 'Alle Passwörter invalidieren und Kunden zur Neuvergabe zwingen, MD5-Hashes migrieren, 2FA für alle Accounts aktivieren',
              score: 10,
              feedback:
                'Umfassend und richtig! Das Invalidieren aller Passwörter ist die sicherste ' +
                'Maßnahme. MD5-Migration und 2FA erhöhen die Sicherheit nachhaltig.',
              nextScene: 6,
              isOptimal: true,
            },
            {
              id: '5-b',
              text: 'Nur die Accounts mit MD5-Hashes invalidieren',
              score: 6,
              feedback:
                'Teilweise richtig, aber unvollständig. Auch bcrypt-Hashes können bei ' +
                'ausreichend Zeit geknackt werden.',
              nextScene: 6,
              isOptimal: false,
            },
            {
              id: '5-c',
              text: 'Abwarten – bcrypt ist sicher, Handlungsbedarf nur bei MD5',
              score: 3,
              feedback:
                'Zu optimistisch. Eine proaktive Maßnahme schützt Kunden besser und ' +
                'zeigt Verantwortungsbewusstsein.',
              nextScene: 6,
              isOptimal: false,
            },
          ],
        },
        {
          id: 6,
          title: 'Umgang mit Medienanfragen',
          narrative:
            'Ein Journalist hat von der Datenpanne erfahren und fragt nach einer Stellungnahme. ' +
            'Die Story erscheint morgen. Was tun Sie?',
          illustration: 'shield-alert',
          timeLimitSec: null,
          choices: [
            {
              id: '6-a',
              text: 'Transparente Pressemitteilung: Sachverhalt darstellen, ergriffene Maßnahmen kommunizieren, Verantwortung übernehmen',
              score: 10,
              feedback:
                'Richtig! Transparenz in Krisensituationen schützt die Reputation langfristig. ' +
                '"No comment" oder Ausweichen verstärkt den Verdacht.',
              nextScene: 7,
              isOptimal: true,
            },
            {
              id: '6-b',
              text: '"Kein Kommentar" – die rechtliche Abteilung muss erst prüfen',
              score: 4,
              feedback:
                'In komplexen Rechtsfragen sinnvoll, aber "kein Kommentar" wird oft als ' +
                'Schuldeingeständnis interpretiert. Eine kurze Stellungnahme ist besser.',
              nextScene: 7,
              isOptimal: false,
            },
            {
              id: '6-c',
              text: 'Den Journalisten bitten, die Story zu verschieben und mit Informationen kooperieren',
              score: 6,
              feedback:
                'Kooperation ist gut, aber Sie können keine Verschiebung erzwingen. ' +
                'Besser: proaktiv und transparent kommunizieren.',
              nextScene: 7,
              isOptimal: false,
            },
          ],
        },
        {
          id: 7,
          title: 'Langfristige Maßnahmen',
          narrative:
            'Die akute Krise ist überstanden. Nun gilt es, systematische Schwachstellen ' +
            'zu beseitigen. Das Identity and Access Management (IAM) hat offensichtlich Lücken.',
          illustration: 'database',
          timeLimitSec: null,
          choices: [
            {
              id: '7-a',
              text: 'IAM-Audit: alle aktiven Accounts reviewen, Offboarding-Prozess überarbeiten, Zugriffsrechte nach Least-Privilege-Prinzip neu vergeben, regelmäßige Access Reviews einführen',
              score: 10,
              feedback:
                'Exzellent! Das Least-Privilege-Prinzip und regelmäßige Access Reviews sind ' +
                'fundamental für eine solide IAM-Strategie und ISO 27001 A.9.',
              nextScene: 'end',
              isOptimal: true,
            },
            {
              id: '7-b',
              text: 'Alle Drittanbieter-Accounts generell deaktivieren',
              score: 4,
              feedback:
                'Zu drastisch – viele Geschäftsprozesse hängen von Drittanbietern ab. ' +
                'Strukturiertes IAM ist die richtige Lösung.',
              nextScene: 'end',
              isOptimal: false,
            },
            {
              id: '7-c',
              text: 'Einen neuen Dienstleister für das IAM beauftragen',
              score: 5,
              feedback:
                'Externe Expertise kann helfen, aber ohne interne Prozessänderungen ' +
                'bleibt das Risiko bestehen.',
              nextScene: 'end',
              isOptimal: false,
            },
          ],
        },
      ],
    }),
  },

  // ─── SCENARIO 4: PRODUKTIONSAUSFALL ───────────────────────────────────────
  {
    id: 'sim-scenario-outage',
    code: 'SIM-OUTAGE-001',
    title: 'Kritischer Produktionsausfall',
    description:
      'Das kritische Produktionssystem ist ausgefallen. Testen Sie Ihre ' +
      'Incident-Management-Fähigkeiten und Business-Continuity-Kenntnisse.',
    category: 'operational',
    difficulty: 'medium',
    estimatedMinutes: 20,
    decisionTree: JSON.stringify({
      meta: {
        totalScenes: 5,
        maxPossibleScore: 50,
        placeholders: ['{{SYSTEM_NAME}}', '{{INCIDENT_MANAGER}}'],
      },
      scenes: [
        {
          id: 0,
          title: 'System-Ausfall gemeldet',
          narrative:
            'Es ist 10:23 Uhr. Das Monitoring-System sendet kritische Alerts: ' +
            '{{SYSTEM_NAME}} antwortet nicht mehr. Das System verarbeitet alle ' +
            'Kundenbestellungen – aktuell sind ca. 2.000 EUR Umsatz pro Minute gefährdet.',
          illustration: 'server-crash',
          timeLimitSec: 60,
          freeTextPrompt: 'Was ist Ihre erste Maßnahme in den nächsten 5 Minuten?',
          choices: [
            {
              id: '0-a',
              text: 'Incident Manager ({{INCIDENT_MANAGER}}) und On-Call-Team sofort alarmieren, Incident-Ticket eröffnen',
              score: 10,
              feedback:
                'Richtig! Die schnelle Eskalation und Ticket-Eröffnung stellt sicher, ' +
                'dass alle Beteiligten informiert sind und die Reaktionszeit dokumentiert wird.',
              nextScene: 1,
              isOptimal: true,
            },
            {
              id: '0-b',
              text: 'Server neu starten',
              score: 5,
              feedback:
                'Ein Neustart kann helfen, aber ohne Diagnose kann er die Situation verschlimmern. ' +
                'Und ohne Eskalation fehlt die Koordination.',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-c',
              text: 'Logs analysieren, um die Ursache zu verstehen',
              score: 7,
              feedback:
                'Log-Analyse ist wichtig, aber ohne gleichzeitige Eskalation verlieren Sie ' +
                'wertvolle Zeit. Beides sollte parallel passieren.',
              nextScene: 1,
              isOptimal: false,
            },
            {
              id: '0-d',
              text: 'Kunden proaktiv auf der Website über Störungen informieren',
              score: 4,
              feedback:
                'Kundenkommunikation ist wichtig, aber erst nach erster Diagnose. ' +
                'Interne Eskalation hat Vorrang.',
              nextScene: 1,
              isOptimal: false,
            },
          ],
        },
        {
          id: 1,
          title: 'Diagnose',
          narrative:
            'Das Incident-Team ist zusammen. Die Logs zeigen: Ein Datenbankupdate ' +
            'wurde heute Nacht um 02:00 Uhr eingespielt. Seitdem steigt die CPU-Last ' +
            'kontinuierlich bis zum Absturz. Was ist die wahrscheinlichste Ursache?',
          illustration: 'server-crash',
          timeLimitSec: null,
          choices: [
            {
              id: '1-a',
              text: 'Regressionstest des Updates durchführen – Datenbankabfragen auf Performance prüfen, Query-Plan analysieren',
              score: 10,
              feedback:
                'Korrekte Diagnose-Methodik! Ein schlecht optimiertes Update kann ' +
                'Full-Table-Scans verursachen, die die Datenbank unter Last zum Absturz bringen.',
              nextScene: 2,
              isOptimal: true,
            },
            {
              id: '1-b',
              text: 'Sofort Rollback des Updates einleiten',
              score: 8,
              feedback:
                'Schnelle Lösung, aber ohne Diagnose wissen Sie nicht sicher, ob das Update ' +
                'die Ursache ist. Riskieren Sie Datenverlust ohne vorherige Analyse.',
              nextScene: 2,
              isOptimal: false,
            },
            {
              id: '1-c',
              text: 'Mehr RAM und CPU zum Server hinzufügen',
              score: 2,
              feedback:
                'Symptombehandlung ohne Ursachenanalyse. Der erhöhte Ressourcenbedarf ' +
                'ist die Folge, nicht die Ursache.',
              nextScene: 2,
              isOptimal: false,
            },
          ],
        },
        {
          id: 2,
          title: 'Rollback oder Fix?',
          narrative:
            'Bestätigt: Das Update enthält eine ineffiziente Query, die bei mehr als ' +
            '10.000 gleichzeitigen Datensätzen einen Full-Table-Scan auslöst. ' +
            'Rollback dauert 20 Minuten, Query-Fix ca. 2 Stunden. Was wählen Sie?',
          illustration: 'database',
          timeLimitSec: null,
          choices: [
            {
              id: '2-a',
              text: 'Rollback sofort einleiten, Query-Fix parallel in Testumgebung entwickeln und später geordnet deployen',
              score: 10,
              feedback:
                'Optimale Strategie! Rollback stellt den Betrieb schnell wieder her, ' +
                'während der Fix sauber entwickelt und getestet werden kann.',
              nextScene: 3,
              isOptimal: true,
            },
            {
              id: '2-b',
              text: '2 Stunden Query-Fix abwarten – das Update enthält wichtige Features',
              score: 4,
              feedback:
                '2 Stunden Ausfall bedeuten ca. 240.000 EUR Umsatzverlust. ' +
                'Features können nach dem Rollback sauber deployed werden.',
              nextScene: 3,
              isOptimal: false,
            },
            {
              id: '2-c',
              text: 'Manuellen Workaround einrichten: Bestellungen manuell verarbeiten lassen',
              score: 3,
              feedback:
                'Kurzfristig denkbar, aber skaliert nicht. Bei 2.000 EUR/min Umsatz ' +
                'ist manuelle Verarbeitung keine echte Option.',
              nextScene: 3,
              isOptimal: false,
            },
          ],
        },
        {
          id: 3,
          title: 'Kommunikation während des Vorfalls',
          narrative:
            'Der Rollback läuft (ETA 20 Min). Die Geschäftsführung, Kunden-Support und ' +
            'Vertrieb warten auf Updates. Wie kommunizieren Sie den Incident-Status?',
          illustration: 'shield-alert',
          timeLimitSec: null,
          choices: [
            {
              id: '3-a',
              text: 'Statuspage aktualisieren, interne Updates alle 10 Min an Stakeholder, Kunden-Support mit Sprachregelung versorgen',
              score: 10,
              feedback:
                'Professionelles Incident-Management! Regelmäßige Updates halten ' +
                'alle Beteiligten informiert und verhindern Panik und parallele Eskalationen.',
              nextScene: 4,
              isOptimal: true,
            },
            {
              id: '3-b',
              text: 'Erst kommunizieren, wenn das System wieder läuft',
              score: 3,
              feedback:
                'Zu spät! Kunden und interne Teams sind bereits beunruhigt. ' +
                'Proaktive Kommunikation auch während des Incidents ist essenziell.',
              nextScene: 4,
              isOptimal: false,
            },
            {
              id: '3-c',
              text: 'Nur intern kommunizieren, keine Kundenkommunikation',
              score: 5,
              feedback:
                'Interne Kommunikation ist gut, aber Kunden, die betroffen sind, ' +
                'erwarten eine Statusmeldung.',
              nextScene: 4,
              isOptimal: false,
            },
          ],
        },
        {
          id: 4,
          title: 'Post-Incident Review',
          narrative:
            'Das System läuft wieder. Total-Ausfallzeit: 47 Minuten, ca. 94.000 EUR Umsatzverlust. ' +
            'Wie verhindern Sie einen ähnlichen Vorfall in Zukunft?',
          illustration: 'server-crash',
          timeLimitSec: null,
          choices: [
            {
              id: '4-a',
              text: 'Post-Incident Review: Deployment-Prozess verbessern (stagings + Load Testing vor Prod), Rollback-Zeiten optimieren, Monitoring-Schwellenwerte anpassen',
              score: 10,
              feedback:
                'Vollständige Maßnahmen! Load-Testing in Staging-Umgebungen hätte ' +
                'den Fehler vor dem Production-Deployment erkannt.',
              nextScene: 'end',
              isOptimal: true,
            },
            {
              id: '4-b',
              text: 'Den verantwortlichen Entwickler verwarnen',
              score: 1,
              feedback:
                'Blame-Kultur löst keine systemischen Probleme. Der Fehler liegt im ' +
                'Deployment-Prozess, nicht beim Individuum.',
              nextScene: 'end',
              isOptimal: false,
            },
            {
              id: '4-c',
              text: 'Mehr Server kaufen (horizontale Skalierung)',
              score: 3,
              feedback:
                'Skalierung hilft bei Performance-Problemen, aber ein Full-Table-Scan ' +
                'würde auch auf mehr Servern die Datenbank überlasten.',
              nextScene: 'end',
              isOptimal: false,
            },
          ],
        },
      ],
    }),
  },
];

export async function seedSimulations() {
  console.log('  Seeding simulation scenarios...');

  for (const scenario of scenarios) {
    await prisma.simulationScenario.upsert({
      where: { id: scenario.id },
      update: {
        title: scenario.title,
        description: scenario.description,
        category: scenario.category,
        difficulty: scenario.difficulty,
        estimatedMinutes: scenario.estimatedMinutes,
        decisionTree: scenario.decisionTree,
      },
      create: scenario,
    });
  }

  console.log(`  ${scenarios.length} simulation scenarios seeded.`);
}

// Allow running standalone
if (require.main === module) {
  seedSimulations()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

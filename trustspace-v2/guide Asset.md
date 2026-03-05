    TrustSpace SBOM Feature – Anforderungen
Was wir bauen wollen
Ein SBOM-Modul im Asset Management von TrustSpace, das:

Pro Asset eine oder mehrere SBOMs verwaltet (eine pro Software-Version)
CycloneDX JSON und SPDX JSON Upload unterstützt
Automatisch alle Komponenten parsed und in der DB speichert
Täglich automatisch CVE-Scans gegen OSV.dev laufen lässt
Gefundene CVEs als separate VEX-Einträge speichert (getrennt vom SBOM, CRA-Pflicht)
Den Asset-Risikoscore basierend auf gefundenen CVEs aktualisiert
Bei Critical/High CVEs Notifications auslöst
Einen Export-Button für Behörden (CRA-konformer SBOM-Download) bereitstellt


Datenbank
Drei neue Tabellen zur bestehenden DB hinzufügen:
sbom_documents – eine SBOM pro Asset pro Version, mit asset_id Referenz, format, version_label, is_latest flag, serial_number, raw_json und uploaded_by
sbom_components – alle geparsten Komponenten einer SBOM, mit purl, name, version, supplier, license_spdx, hash_sha256, dependency_type (direct/transitive) und completeness
vex_vulnerabilities – CVE-Ergebnisse getrennt vom SBOM gespeichert, mit cve_id, cvss_score, severity (LOW/MEDIUM/HIGH/CRITICAL), vex_status (affected/not_affected/fixed/under_investigation), remediation Text und last_checked_at Timestamp

API Routes (Next.js)
POST /api/sbom/upload

Nimmt eine CycloneDX oder SPDX JSON Datei entgegen
Validiert das Format
Setzt vorherige SBOM desselben Assets auf is_latest = false
Parsed alle Komponenten und speichert sie in sbom_components
Triggert direkt nach Upload einen ersten CVE-Scan
Gibt die neue sbom_document_id zurück

GET /api/sbom/[id]

Gibt eine SBOM mit allen Komponenten und zugehörigen CVEs zurück

POST /api/sbom/[id]/scan

Manueller CVE-Scan Trigger für eine spezifische SBOM
Schickt alle PURLs als Batch an OSV.dev
Speichert Ergebnisse in vex_vulnerabilities
Updated den Asset-Risikoscore

GET /api/sbom/[id]/export

Gibt die originale SBOM JSON zurück (für Behörden-Export, CRA-konform)

GET /api/cron/cve-scan (Cron Route, täglich)

Lädt alle is_latest = true SBOMs
Scant alle in 100er Batches gegen OSV.dev
Updated vex_vulnerabilities mit ON CONFLICT Update
Triggert Notifications bei neuen Critical/High CVEs


OSV.dev Integration
Eine Utility-Funktion lib/osv.ts die:

Einen Array von PURLs als Batch-Query an https://api.osv.dev/v1/querybatch schickt
Die Antwort mapped und CVSS Score + Severity extrahiert
Score-zu-Severity Mapping macht: Critical ≥9.0, High ≥7.0, Medium ≥4.0, Low <4.0
Rate Limiting berücksichtigt (max 100 queries pro Request)
Fallback auf NVD API hat falls OSV keine Daten liefert


CycloneDX Parser
Eine Utility-Funktion lib/sbom-parser.ts die:

CycloneDX 1.4+ JSON und SPDX 3.0 JSON erkennt und parsed
Alle Components extrahiert mit name, version, purl, licenses, hashes, supplier
Dependency-Typ (direct vs transitive) aus dem dependencies-Array ableitet
Completeness-Status setzt basierend auf ob alle Dependencies bekannt sind
Bei ungültigem Format einen sprechenden Error wirft


UI (bestehende Asset-Detailseite erweitern)
Einen neuen Tab "SBOM" auf der Asset-Detailseite mit:
Upload-Bereich – Drag & Drop für CycloneDX/SPDX JSON, zeigt Format-Validierung live
Versions-History – Liste aller hochgeladenen SBOMs mit Datum, Version-Label und Komponenten-Anzahl, aktuelle Version markiert
Komponenten-Tabelle – Alle Komponenten mit Name, Version, License, Dependency-Type und CVE-Badge (Anzahl gefundener CVEs mit Severity-Farbe)
CVE-Panel – Aufklappbar pro Komponente, zeigt alle CVEs mit CVE-ID, CVSS Score, Severity, VEX-Status und Link zu NVD
Scan-Button – "Jetzt scannen" triggert manuellen Scan, zeigt Loading-State und last_checked_at Timestamp
Export-Button – Lädt die SBOM JSON herunter, beschriftet als "CRA Export"
Risk-Summary – Oben im Tab: Anzahl Critical/High/Medium/Low CVEs als farbige Badges, davon abgeleiteter Asset-Risikoscore

Notifications
Wenn nach einem Scan neue Critical oder High CVEs gefunden werden:

In-App Notification an den Asset-Owner
Optional: E-Mail via bestehendem Mail-Setup
Notification enthält: Asset-Name, CVE-ID, Severity, betroffene Komponente


Cron Setup
In vercel.json einen Cron-Job eintragen der täglich um 02:00 UTC die /api/cron/cve-scan Route aufruft. Route per CRON_SECRET Environment Variable absichern.

Reihenfolge für Claude Code

DB Migration erstellen und ausführen
lib/sbom-parser.ts – Parser für CycloneDX + SPDX
lib/osv.ts – OSV.dev API Integration
Upload API Route
Scan API Route + Cron Route
Export API Route
UI – SBOM Tab auf Asset-Detailseite

----------------------------------------------------------------------------------------------------------------------------------------22
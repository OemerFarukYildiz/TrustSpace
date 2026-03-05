# TrustSpace ISMS mit Collabora Online

## Features
- **Collabora Online**: Professionelle LibreOffice-basierte Dokumentbearbeitung
- **Unterstützte Formate**: DOCX, XLSX, PPTX, ODT, ODS, ODP
- **Echtzeit-Editing**: Änderungen werden direkt in der Datenbank gespeichert

## Schnellstart

```bash
# Docker Compose starten
docker-compose up -d

# Warten bis Collabora bereit ist (ca. 30 Sekunden)
sleep 30

# App aufrufen
open http://localhost:3000
```

## Services

| Service | Port | Beschreibung |
|---------|------|--------------|
| TrustSpace App | 3000 | Hauptanwendung |
| Collabora Online | 9980 | LibreOffice Online Editor |

## Dokumente bearbeiten

1. Gehe zu **Dokumente**
2. Wähle eine DOCX, XLSX oder andere Office-Datei
3. Klicke **Edit** - Collabora Online öffnet sich
4. Bearbeite das Dokument
5. Speichern erfolgt automatisch

## Fehlerbehebung

### Collabora startet nicht
```bash
docker-compose logs collabora
```

### WOPI-Verbindungsfehler
Prüfe ob beide Container im gleichen Netzwerk sind:
```bash
docker network ls
docker network inspect trustspace-v2_default
```

### Performance
Collabora braucht etwas Zeit zum Starten. Warte 30-60 Sekunden nach `docker-compose up`.

## Volumes
- `./prisma:/app/prisma` - SQLite Datenbank
- `./uploads:/app/uploads` - Hochgeladene Dateien

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `COLLABORA_URL` | http://collabora:9980 | Collabora Server URL |
| `DATABASE_URL` | file:./prisma/dev.db | SQLite Pfad |

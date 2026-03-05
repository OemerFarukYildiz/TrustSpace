# TrustSpace ISMS - Docker Setup

## Schnellstart

```bash
# Mit dem Starter-Skript
chmod +x docker-start.sh
./docker-start.sh

# Oder manuell
docker-compose up -d
```

Die App ist dann unter http://localhost:3000 erreichbar.

## Befehle

```bash
# Starten
docker-compose up -d

# Stoppen
docker-compose down

# Logs anzeigen
docker-compose logs -f

# Neubauen (nach Code-Änderungen)
docker-compose up -d --build

# Backup aktivieren
docker-compose --profile backup up -d
```

## Volumes

- `./prisma:/app/prisma` - SQLite Datenbank
- `./uploads:/app/uploads` - Hochgeladene Dateien
- `./backups:/backups` - Datenbank-Backups (optional)

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `NODE_ENV` | production | Umgebung |
| `DATABASE_URL` | file:./prisma/dev.db | SQLite Datenbank Pfad |
| `PORT` | 3000 | Port |

## Health Check

Die App prüft automatisch:
- HTTP-Status auf `/api/health`
- Datenbank-Verbindung

## Backup

Automatische Backups (täglich):
```bash
docker-compose --profile backup up -d
```

Backups werden in `./backups/` gespeichert (7 Tage aufbewahrt).

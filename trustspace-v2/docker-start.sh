#!/bin/bash

# TrustSpace ISMS Docker Starter Script (with Collabora Online)

set -e

echo "🚀 TrustSpace ISMS + Collabora Online Docker Setup"
echo "===================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for docker compose (newer versions)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Using: $COMPOSE_CMD"

# Create necessary directories
mkdir -p prisma uploads backups

# Check if database exists, if not initialize it
if [ ! -f "prisma/dev.db" ]; then
    echo "📦 Initializing database..."
    touch prisma/dev.db
fi

echo "🔧 Building and starting services..."
echo "   This includes Collabora Online (LibreOffice) - takes a few minutes..."
$COMPOSE_CMD up -d --build

echo ""
echo "⏳ Waiting for Collabora Online to start (this may take 30-60 seconds)..."
sleep 30

echo ""
echo "✅ Services started!"
echo ""
echo "📱 TrustSpace App:     http://localhost:3000"
echo "🔧 Collabora Online:   http://localhost:9980"
echo ""
echo "Bearbeite DOCX, XLSX, PPTX direkt im Browser!"
echo ""
echo "Nützliche Befehle:"
echo "  - Logs anzeigen:    $COMPOSE_CMD logs -f"
echo "  - Stoppen:          $COMPOSE_CMD down"
echo "  - Neustarten:       $COMPOSE_CMD restart"
echo ""

# Wait for health check
echo "⏳ Warte auf Health Check..."
sleep 10

if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ TrustSpace ist bereit!"
    echo "📝 Öffne http://localhost:3000 in deinem Browser"
else
    echo "⚠️  App startet noch... Prüfe Logs: $COMPOSE_CMD logs -f"
fi

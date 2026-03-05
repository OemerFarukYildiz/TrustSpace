#!/bin/sh
set -e

echo "🗄️  Setting up database..."

# Check if database file exists
if [ ! -f "/app/prisma/dev.db" ]; then
    echo "📦 Creating new database..."
    touch /app/prisma/dev.db
fi

# Run Prisma migrations
echo "Running migrations..."
npx prisma migrate deploy || echo "⚠️  Migration warning (continuing anyway)"

# Generate Prisma client (if needed)
echo "Generating Prisma client..."
npx prisma generate || echo "⚠️  Prisma generate warning (continuing anyway)"

echo "✅ Database setup complete!"

# Start the application
echo "🚀 Starting application..."
exec npm start

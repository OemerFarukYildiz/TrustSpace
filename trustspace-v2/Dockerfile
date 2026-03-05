# Dockerfile for TrustSpace ISMS

FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl python3 make g++ wget

# Copy package files
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy prisma
COPY prisma ./prisma/

# Create empty DB and generate client
RUN touch prisma/dev.db && \
    DATABASE_URL="file:./prisma/dev.db" npx prisma generate

# Copy app
COPY . .

# Build with empty DB
RUN touch prisma/dev.db && \
    DATABASE_URL="file:./prisma/dev.db" npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL="file:./prisma/dev.db"
ENV COLLABORA_URL=http://collabora:9980
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

EXPOSE 3000

CMD sh -c "npx prisma migrate deploy && npm start"

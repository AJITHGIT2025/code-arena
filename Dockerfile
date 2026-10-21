# Multi-stage Dockerfile for CODE ARENA
# Stage 1: Build Frontend
FROM node:20-bookworm-slim AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-bookworm-slim AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/src ./src
COPY server/tsconfig.json ./
RUN npm run build

# Stage 3: Production Runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Install runtime dependencies for isolated judge execution (gcc, g++, java, python3)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    default-jdk \
    python3 \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5000

# Copy built server package definitions & production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/server/node_modules/@prisma ./node_modules/@prisma

# Copy built client to where the Express server serves static assets
COPY --from=client-builder /app/client/dist /app/client/dist

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node dist/db/seed.js && node dist/index.js"]

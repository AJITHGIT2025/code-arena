# Multi-stage Dockerfile for CODE ARENA
# Stage 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies for local execution fallback (gcc, g++, openjdk, python3)
RUN apk add --no-cache gcc g++ openjdk17-jdk python3 make

ENV NODE_ENV=production
ENV PORT=5000

# Copy built server
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --omit=dev

COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/server/node_modules/@prisma ./node_modules/@prisma

# Copy built client to where the server serves static files
COPY --from=client-builder /app/client/dist /app/client/dist

EXPOSE 5000

CMD ["sh", "-c", "npx prisma db push && node dist/db/seed.js && node dist/index.js"]

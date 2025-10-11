# Backend Dockerfile (NestJS + Prisma)
FROM node:20-alpine AS deps
WORKDIR /app/backend
# Copy backend manifest and monorepo local package used by backend
COPY backend/package.json backend/package-lock.json* ./
COPY packages/contracts /app/packages/contracts
# Install backend dependencies (including local file: package)
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app/backend
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend/. .
COPY packages/contracts /app/packages/contracts
# Generate Prisma client and build (using SWC to transpile without typecheck)
RUN npx prisma generate && npm run build:swc

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json

EXPOSE 5000
CMD ["node", "dist/main.js"]

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies with npm (project uses npm@11)
# Copy package files for both root and workspace packages
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source and build
COPY . .

# Build the application
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install production dependencies
COPY package.json package-lock.json ./
COPY packages/contracts/package.json ./packages/contracts/
RUN npm ci --omit=dev

# Copy necessary files from build
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/config ./config
COPY --from=builder /app/packages ./packages

# Expose port
EXPOSE 3000

# Start using next start command
CMD ["npx", "next", "start"]

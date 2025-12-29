# Multi-stage build for Universal AI Support Chatbot System
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json ./
COPY .npmrc ./
RUN npm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy necessary files for runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/endpoints ./endpoints
COPY --from=builder /app/helpers ./helpers
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/database ./database
COPY --from=builder /app/loadEnv.js ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/vite.config.ts ./

# tsx should already be in node_modules from dependencies

USER nodejs

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/_api/auth/session', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["npx", "tsx", "server.ts"]

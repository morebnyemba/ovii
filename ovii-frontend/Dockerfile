# ovii-frontend/Dockerfile

# ---- Base Stage ----
# Using a Debian-based image like 'slim-bullseye' instead of 'alpine' can improve
# compatibility with some native Node.js modules and build tools.
FROM node:18-bullseye-slim AS base
# --- Stage 1: Dependency Installation ---
FROM node:18-alpine AS deps

WORKDIR /app

# ---- Dependencies Stage ----
# Install dependencies in a separate layer to leverage Docker's caching mechanism.
# This layer is only rebuilt when package.json or package-lock.json changes.
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci
# Copy package.json and lock file
COPY package.json yarn.lock* package-lock.json* ./

# ---- Builder Stage ----
# Build the Next.js application.
FROM base AS builder
# Install dependencies
RUN \
  if [ -f yarn.lock ]; then \
    yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    npm ci; \
  else \
    npm i; \
  fi

# Copy dependencies from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules
# --- Stage 2: Code Builder ---
FROM node:18-alpine AS builder

# Copy all other source files.
# This is more resilient to filename variations (e.g., .js vs .mjs, casing)
# and optional config files than listing every single file to be copied.
# The .dockerignore file will prevent node_modules, .next, etc., from being copied.
COPY . .

# Get the build-time argument for the WebSocket URL.
ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}

# Build the Next.js application. This will use the `output: 'standalone'` configuration.
# The NEXT_TELEMETRY_DISABLED=1 flag is added to reduce build log noise.
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN npm run build

# ---- Production/Runner Stage ----
# Create the final, minimal production image.
FROM base AS runner
# --- Stage 3: Production Runner ---
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000

RUN addgroup --system --gid 1001 nextjs && adduser --system --uid 1001 nextjs
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary artifacts from the builder stage for a small, secure image.
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

CMD ["node", "server.js"]
EXPOSE 3000

CMD ["npm", "start"]
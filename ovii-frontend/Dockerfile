# ovii-frontend/Dockerfile

# ---- Base Stage ----
# Use a specific, lightweight Node.js version for reproducibility and smaller image sizes.
FROM node:18-alpine AS base
WORKDIR /app

# ---- Dependencies Stage ----
# Install dependencies in a separate layer to leverage Docker's caching mechanism.
# This layer is only rebuilt when package.json or package-lock.json changes.
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ---- Builder Stage ----
# Build the Next.js application.
FROM base AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules
# Copy all other source files, including next.config.mjs and tsconfig.json.
COPY . .

# --- DEBUGGING STEP ---
# List all files recursively to verify that everything was copied correctly with the right casing.
RUN ls -R

# Get the build-time argument for the WebSocket URL.
ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}

# Build the Next.js application. This will use the `output: 'standalone'` configuration.
RUN npm run build

# ---- Production/Runner Stage ----
# Create the final, minimal production image.
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
EXPOSE 3000

RUN addgroup --system --gid 1001 nextjs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

CMD ["node", "server.js"]
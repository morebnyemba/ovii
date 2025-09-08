# ovii-frontend/Dockerfile

# ---- Base Stage ----
# Using a Debian-based image like 'slim-bullseye' instead of 'alpine' can improve
# compatibility with some native Node.js modules and build tools.
FROM node:18-bullseye-slim AS base
WORKDIR /app

# ---- Dependencies Stage ----
# Install dependencies in a separate layer to leverage Docker's caching mechanism.
# This layer is only rebuilt when package.json or package-lock.json changes.
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Builder Stage ----
# Build the Next.js application.
FROM base AS builder

# Copy dependencies from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy all other source files.
# This is more resilient to filename variations (e.g., .js vs .mjs, casing)
# and optional config files than listing every single file to be copied.
# The .dockerignore file will prevent node_modules, .next, etc., from being copied.
COPY . .

# --- EXPLICIT DEBUGGING STEP ---
# Let's check for the exact files the build is failing on.
# This will tell us if they exist and what their casing is.
RUN echo "--- Checking for tsconfig.json ---" && ls -l tsconfig.json
RUN echo "--- Checking for src/lib/api.ts (or .js) ---" && ls -l src/lib/api.* || echo "--- >>> src/lib/api.* NOT FOUND <<< ---"
RUN echo "--- Checking for src/lib/store/useUserStore.ts (or .js) ---" && ls -l src/lib/store/useUserStore.* || echo "--- >>> src/lib/store/useUserStore.* NOT FOUND <<< ---"
RUN echo "--- Finished debugging file paths ---"

# Get the build-time argument for the WebSocket URL.
ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}

# Build the Next.js application. This will use the `output: 'standalone'` configuration.
# The NEXT_TELEMETRY_DISABLED=1 flag is added to reduce build log noise.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Production/Runner Stage ----
# Create the final, minimal production image.
FROM base AS runner

ENV NODE_ENV=production
EXPOSE 3000

RUN addgroup --system --gid 1001 nextjs && adduser --system --uid 1001 nextjs

# Copy only the necessary artifacts from the builder stage for a small, secure image.
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

CMD ["node", "server.js"]
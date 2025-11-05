# ovii-frontend/Dockerfile

# --- Stage 1: Dependency Installation ---
# Use a specific version of Node.js for reproducibility. 'alpine' is lightweight.
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package.json and the npm lock file
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# --- Stage 2: Code Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

# Get the build-time argument for the WebSocket URL.
ARG NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_PUBLIC_WEBSOCKET_URL=${NEXT_PUBLIC_WEBSOCKET_URL}

# Copy dependencies from the previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code.
COPY . .

# Disable Next.js telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# --- Stage 3: Production Runner ---
# Use a minimal image for the final stage.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable Next.js telemetry in production.
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user and group for security.
# Using -S creates a system user/group without a home directory or password.
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy only the necessary artifacts from the builder stage for a small, secure image.
# This assumes `output: 'standalone'` in `next.config.js`.
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

USER nextjs
EXPOSE 3000

# The standalone output includes a `server.js` file to run the application.
CMD ["node", "server.js"]
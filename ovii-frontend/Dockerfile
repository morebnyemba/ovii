# Temporary single-stage Dockerfile for debugging

# If this build fails, the issue is with the source files being copied from the host.
# If it succeeds, the issue is with the multi-stage COPY commands.
FROM node:18-bullseye-slim AS debug

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# --- EXPLICIT DEBUGGING STEP ---
RUN echo "--- (Debug Build) Checking for tsconfig.json ---" && ls -l tsconfig.json
RUN echo "--- (Debug Build) Checking for src/lib/api.ts (or .js) ---" && ls -l src/lib/api.* || echo "--- >>> (Debug Build) src/lib/api.* NOT FOUND <<< ---"
RUN echo "--- (Debug Build) Checking for src/lib/store/useUserStore.ts (or .js) ---" && ls -l src/lib/store/useUserStore.* || echo "--- >>> (Debug Build) src/lib/store/useUserStore.* NOT FOUND <<< ---"
RUN echo "--- (Debug Build) Finished debugging file paths ---"

# Try to build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# This image is for debugging only, so we don't need a CMD.
# If the build succeeds, the image will be created but won't be used by docker-compose to run a container.
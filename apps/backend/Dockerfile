# Use the official Bun image
FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY apps/backend ./apps/backend

# Build database package
RUN cd packages/database && bun run generate

# Build backend
RUN cd apps/backend && bun run build

# Production stage
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy built files
COPY --from=base /app/apps/backend/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/backend/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["bun", "dist/index.js"]
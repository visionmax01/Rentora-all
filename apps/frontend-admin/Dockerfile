# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/frontend-admin/package.json ./apps/frontend-admin/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/types ./packages/types
COPY apps/frontend-admin ./apps/frontend-admin

# Build application
RUN cd apps/frontend-admin && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/frontend-admin/.next/standalone ./
COPY --from=builder /app/apps/frontend-admin/.next/static ./.next/static
COPY --from=builder /app/apps/frontend-admin/public ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3003

EXPOSE 3003

CMD ["node", "server.js"]
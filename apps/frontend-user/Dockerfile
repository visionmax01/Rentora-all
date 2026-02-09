# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/frontend-user/package.json ./apps/frontend-user/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/types ./packages/types
COPY apps/frontend-user ./apps/frontend-user

# Build application
RUN cd apps/frontend-user && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/frontend-user/.next/standalone ./
COPY --from=builder /app/apps/frontend-user/.next/static ./.next/static
COPY --from=builder /app/apps/frontend-user/public ./public

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
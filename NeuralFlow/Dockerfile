# Multi-stage build for NeuralFlow V5
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --prefix backend --only=production
RUN npm ci --prefix frontend

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build frontend
RUN npm run build --prefix frontend

# Production stage
FROM node:18-alpine

# Install production dependencies
RUN apk add --no-cache tini

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/backend ./backend
COPY --from=builder --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p backend/logs backend/models && \
    chown -R nodejs:nodejs backend/logs backend/models

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3001 4000 5100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use tini to handle signals properly
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "backend/src/server.js"]

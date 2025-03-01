# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Next.js to output standalone
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build arguments for environment variables
ARG NEXT_PUBLIC_ACCESS_PASSWORD
ENV NEXT_PUBLIC_ACCESS_PASSWORD=$NEXT_PUBLIC_ACCESS_PASSWORD

# API keys needed during build
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY

ARG FAL_API_KEY
ENV FAL_API_KEY=$FAL_API_KEY

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user to run the app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the correct user
USER nextjs

# Expose the port
EXPOSE 3000

# Set the correct environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Start the app
CMD ["node", "server.js"]

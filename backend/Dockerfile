FROM node:22-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all deps (including dev for TypeScript compilation)
RUN npm install --include=dev

# Copy source code
COPY . .

# Build TypeScript and copy migrations
RUN npm run build

# Remove dev dependencies to slim down
RUN npm prune --production

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start with IPv4 preference
CMD ["node", "--dns-result-order=ipv4first", "dist/main.js"]

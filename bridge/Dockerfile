FROM node:20-alpine

# Create app directory
WORKDIR /bridge

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app files
COPY . .
RUN npx tsc

# Default command overridden in docker-compose
CMD ["node", "bridge.js"]
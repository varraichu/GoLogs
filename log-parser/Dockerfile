FROM node:20-alpine

# Create app directory
WORKDIR /worker

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

RUN mkdir -p /worker/logs

# Copy app files
COPY . .
RUN npx tsc

# Default command overridden in docker-compose
CMD ["node", "worker.js"]

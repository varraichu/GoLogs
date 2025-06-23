# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose port your backend listens on (adjust as needed)
EXPOSE 4000

# Start the server (adjust if you're using ts-node, nodemon, etc.)
CMD ["npm", "run", "dev"]

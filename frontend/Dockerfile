# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the project
COPY . .

# Expose the Vite dev server port
EXPOSE 5173

# Run the Vite dev server
CMD ["npm", "run", "dev", "--", "--host"]

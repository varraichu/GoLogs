# This Dockerfile is for running the OJET DEVELOPMENT server.

# Use a Node.js base image
FROM node:18-alpine

# Install the Oracle JET CLI globally
RUN npm install -g @oracle/ojet-cli

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
# This is done first to leverage Docker's layer caching.
COPY package*.json ./
RUN npm install

# Copy the rest of your application source code
# This will be overridden by the volume mount in docker-compose,
# but it's good practice to include it for building the image.
COPY . .

RUN npx ojet build --release

RUN npm install -g serve
# The default port for 'ojet serve' is 8000.
EXPOSE 8000

# The command to start the development server.
# --server-host=0.0.0.0 is crucial to make the server accessible
# from outside the container.
CMD ["npx","ojet", "serve"]
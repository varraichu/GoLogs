Log Collector Microapplication
A central service for collecting, processing, and viewing logs from multiple applications. This microservice architecture is designed to handle logs from various sources, process them efficiently, and provide a user-friendly web interface for monitoring and management.

Features
Centralized Logging: Aggregate logs from multiple applications into a single, searchable location.

Multiple Log Sources: Collect logs from files, stdin, and PostgreSQL databases.

Scalable Processing: Utilizes Redis and BullMQ for robust and scalable log processing queues.

Persistent Storage: Stores processed logs in a MongoDB database for long-term retention and analysis.

Web-Based UI: A user-friendly frontend built with Oracle JET for viewing logs and managing applications.

Role-Based Access Control: Differentiates between admin and user roles, with admins having the ability to manage applications, users, and groups.

Containerized Deployment: The entire application stack can be easily spun up using Docker Compose.

System Architecture
The application follows a microservice architecture. Here's a high-level overview of the log flow:

Log Collection (fluent-bit): The log-collector service, running a custom fluent-bit script, gathers logs from configured sources (files, stdin, Postgres).

Queuing (Redis): Logs are pushed to a Redis queue.

Bridging (Node.js Script): The bridge service runs a script that pulls logs in bulk from Redis and pushes them to a BullMQ instance.

Bulk Processing (BullMQ): The log-parser service runs BullMQ jobs to process the logs in bulk.

Storage (MongoDB): The processed logs are then stored in a MongoDB database.

Frontend & Backend: The frontend (Oracle JET) and backend (Node.js/Express) services provide the user interface and API for interacting with the logs and managing the system.

[App 1] --\
[App 2] ----> [fluent-bit] -> [Redis] -> [Bridge] -> [BullMQ] -> [MongoDB]
[App 3] --/                                                    ^
                                                               |
                                                          [Backend API]
                                                               |
                                                          [Frontend UI]

Folder Structure
Here is a breakdown of the project's directory structure:

/root
├── backend/         # Node.js/Express backend providing secure API endpoints
├── demo-app/        # A sample application to generate logs for testing
├── bridge/          # Script to move logs from Redis to BullMQ
├── log-collector/   # Custom fluent-bit configuration and scripts
├── frontend/        # Oracle JET frontend for dashboards and log viewing
├── log-parser/      # BullMQ worker to process and store logs in MongoDB
├── redis/           # Configuration for Redis with AOF persistence
├── docker-compose.yml # Main Docker Compose file to orchestrate all services
├── .env             # Root environment variables
├── README.md        # This file
├── .gitignore       # Git ignore file
└── .github/
    └── workflows/   # CI/CD workflows

Installation and Setup
Follow these steps to get the application up and running on your local machine.

Prerequisites:

Docker and Docker Compose

Git

Steps:

Clone the Repository:

git clone <your-repository-url>
cd <repository-folder>

Configure Root Environment Variables:
Create a .env file in the root directory of the project. You will need to add your MongoDB connection string here.

# .env
MONGODB_URI=your_mongodb_connection_string

Configure Backend Environment Variables:
Navigate to the backend directory and create another .env file.

cd backend
```env
# backend/.env
# Add any backend-specific environment variables here
# For example:
PORT=3000
JWT_SECRET=your_jwt_secret

Set Up Service Account Credentials:
Inside the backend directory, create a new folder named credentials.

mkdir credentials

Place your Google Service Account key file inside this folder and name it service-account-key.json. This is required for certain backend functions.

## Configure the Demo Application (Optional)

You can adjust the demo application's log generation behavior through environment variables in the **root `.env` file**.

### Available Environment Variables

- **`LOG_COUNT`**  
  Controls how many logs are generated per interval.

- **`APP_NAME`**  
  Sets the name of the application (used to tag logs).

### Example `.env` Configuration

```env
LOG_COUNT=10
APP_NAME=DemoApp

## Important
Before generating logs, make sure an application with the same name as APP_NAME already exists in your MongoDB database.
Otherwise, the demo app will not be able to associate logs with it, and log generation will fail.

Usage
Once the setup is complete, you can start all the services using Docker Compose.

Start the Application:
From the root directory of the project, run:

docker-compose up -d

This command will build the images (if they don't exist) and start all the containers in detached mode.

Access the Frontend:
Open your web browser and navigate to:
http://localhost:8000

You should see the application's login page or dashboard.

Monitoring
Live Logs: Once the application is running, you will see logs flowing through the system and appearing on the frontend dashboard.

Container Logs: To view the logs for a specific service, you can use the docker logs command. For example, to view the logs of the backend container:

docker logs -f <backend_container_name>

You can find the container names by running docker ps.

Admin Information
Admin Access: Only users with an email address ending in @gosaas.io are granted administrative privileges.

Admin Functions: Admins can create and manage applications, assign applications to users and user groups, and remove them through the web interface.

This README was generated with assistance from an AI model.
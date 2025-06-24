
# GoLogs

A log collection microservice system built with Node.js, Redis, Fluent Bit, and a full-stack (frontend + backend) application.

---

## 📁 Project Structure

```

.
├── backend/           # Express or other backend API
├── frontend/          # Vite + Vue/React frontend
├── log-collector/     # Bridge service: moves logs from Redis list to BullMQ
├── log-parser/        # Worker service: processes logs from BullMQ
├── logs/              # Shared log volume (e.g., processed logs)
├── redis/             # Redis configs or data (if any)
├── docker-compose.yml
└── README.md

````

---

## 🚀 Running the Full System with Docker Compose

### 1. Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Start All Services

```bash
docker compose up --build -d
````

*(Use `docker-compose` instead of `docker compose` based on your system.)*

This will start the following services:

* `redis` – In-memory data store used for log buffering and queues
* `fluent-bit` – Reads logs from `./logs/` and pushes them into Redis
* `bridge` – Atomic log mover from Redis list to BullMQ
* `worker` – Consumes logs from BullMQ and writes to `logs/processed_logs.log`
* `backend` – Exposes API on port `4000`
* `frontend` – Vite dev server on port `5173`

> Logs are written and shared via the `./logs/` volume.

### 3. Stopping All Services

```bash
docker compose down
```

*(Use `docker-compose` instead of `docker compose` based on your system.)*

---

## 🧪 Development Notes

* Frontend auto-reloads via `npm run dev -- --host` inside the container.
* Backend mounts the `./backend` folder for live code updates.
* Processed logs are written to `logs/processed_logs.log`.
* Redis is exposed locally on port `6379`.

---

## 🔍 Useful Commands

### View Logs for a Specific Service

```bash
docker compose logs -f <service-name>
```

### Rebuild a Single Service

```bash
docker compose build <service-name>
docker compose up -d <service-name>
```

**Available service names:**

```
bridge
worker
redis
fluent-bit
frontend
backend
```

---

## 🛠️ Future Options

* MongoDB integration (commented out in compose)
* Custom Fluent Bit configurations (already stubbed)
* Persistent Redis volumes already defined (`redis-data`)
* Consider using a `.env` file for configurable ports and secrets

---

## 👥 Contributors

Ensure collaborators have Docker installed and simply run:

```bash
git clone <your-repo-url>
cd <project-folder>
docker compose up --build
```


CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    app_id TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    log_type TEXT NOT NULL
);
#!/bin/bash

# Function to handle cleanup
cleanup() {
    echo "Shutting down..."
    kill $APP_PID $FLUENT_PID 2>/dev/null
    wait
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "Starting combined app and fluent-bit container..."

# Start the Node.js app in the background
echo "Starting Node.js application..."
cd /demo-app/src
node index.js &
APP_PID=$!

# Give the app a moment to start
sleep 2

# Start Fluent Bit in the background
echo "Starting Fluent Bit..."
/opt/fluent-bit/bin/fluent-bit -c /etc/fluent-bit/fluent-bit.conf -e /opt/fluent-bit/lib/out_redis.so &
FLUENT_PID=$!

# Wait for both processes
echo "Both services started. App PID: $APP_PID, Fluent Bit PID: $FLUENT_PID"
echo "Waiting for processes to complete..."

# Wait for either process to exit
wait -n

# If we get here, one process has exited, so cleanup
cleanup
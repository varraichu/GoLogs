#!/bin/bash

echo "Starting Node.js application..."
cd /demo-app/src

# Create logs directory if it doesn't exist
mkdir -p /demo-app/src/logs

# Start the app and tee stdout to a file (in the background)
node index.js | tee -a /demo-app/src/logs/stdout.log 
echo "App started"

# Start Fluent Bit independently
echo "Starting Fluent Bit..."
/opt/fluent-bit/bin/fluent-bit \
    -c /etc/fluent-bit/fluent-bit.conf \
    -e /opt/fluent-bit/lib/out_redis.so

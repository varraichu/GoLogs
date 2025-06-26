#!/bin/bash

echo "Starting Node.js application..."
cd /demo-app/src


echo "Starting application and Fluent Bit in a pipeline..."
# The 'exec' command replaces the shell with the pipeline, making it PID 1.

# ADD THE -e FLAG HERE TO LOAD YOUR CUSTOM PLUGIN
exec node index.js | /opt/fluent-bit/bin/fluent-bit \
    -c /etc/fluent-bit/fluent-bit.conf \
    -e /opt/fluent-bit/lib/out_redis.so
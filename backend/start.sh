#!/bin/bash
# Default to port 8000 if $PORT is not set
PORT=${PORT:-8000}

echo "Starting FastAPI on port $PORT..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT

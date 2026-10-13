#!/usr/bin/env bash
set -e

# Change to project root directory
cd "$(dirname "$0")/.."

# Verify Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker daemon is not running."
    exit 1
fi

VITE_PID=""
SERVER_PID=""

# Stop all background processes and Caddy on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    if [ -n "$VITE_PID" ]; then
        kill "$VITE_PID" 2>/dev/null || true
        pkill -P "$VITE_PID" 2>/dev/null || true
    fi
    if [ -n "$SERVER_PID" ]; then
        kill "$SERVER_PID" 2>/dev/null || true
        pkill -P "$SERVER_PID" 2>/dev/null || true
    fi
    caddy stop >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Start Caddy reverse proxy
echo "Starting Caddy..."
caddy start --config Caddyfile

# Start Vite dev server
echo "Starting Vite dev server..."
npm --prefix web run dev &
VITE_PID=$!

# Start Baddify backend server
echo "Starting Baddify backend..."
go run ./cmd/server &
SERVER_PID=$!

# Wait for background processes
wait -n "$VITE_PID" "$SERVER_PID" 2>/dev/null || wait

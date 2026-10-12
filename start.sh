#!/usr/bin/env bash
set -e

# Change to project root directory
cd "$(dirname "$0")"

# Verify Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker daemon is not running."
    exit 1
fi

# Ensure Caddy is stopped on exit
cleanup() {
    echo ""
    echo "Stopping Caddy..."
    caddy stop >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Start Caddy reverse proxy
echo "Starting Caddy..."
caddy start --config Caddyfile

# Start Baddify server
echo "Starting Baddify server..."
go run ./cmd/server

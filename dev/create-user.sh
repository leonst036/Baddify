#!/usr/bin/env bash
set -e

# Change to project root directory
cd "$(dirname "$0")/.."

go run ./dev/create_user.go "$@"

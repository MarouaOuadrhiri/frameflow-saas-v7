#!/usr/bin/env bash
# FrameFlow SaaS — run backend + frontend together with one command.
#
# Usage:
#   ./dev.sh
#
# Backend  -> http://localhost:5000
# Frontend -> http://localhost:3000
#
# Press Ctrl+C to stop both.

set -e
cd "$(dirname "$0")"

trap 'kill 0 2>/dev/null' EXIT

echo "Starting backend (port 5000)..."
(cd backend && npm run dev) &

echo "Starting frontend (port 3000)..."
(cd frontend && npm run dev) &

wait

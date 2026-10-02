#!/usr/bin/env bash
# AgentGuard v2.4.1 Startup Script
set -e

echo "=========================================================="
echo " Starting AgentGuard Gateway & Frontend (v2.4.1)"
echo " Warm Technical Security Governance System"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Backend
echo "--> Starting FastAPI Backend on http://127.0.0.1:8000..."
python3 -m uvicorn agentguard.backend.main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start Frontend
echo "--> Starting Vite Frontend on http://127.0.0.1:5173..."
cd "$SCRIPT_DIR/agentguard/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "AgentGuard Gateway is LIVE:"
echo " - Frontend Dashboard: http://127.0.0.1:5173"
echo " - Backend API:        http://127.0.0.1:8000"
echo " - API Documentation:  http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT
wait

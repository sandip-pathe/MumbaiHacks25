#!/bin/bash

# ReguPulse - Complete Startup Script
# Starts all services: Redis, Backend, Worker, and Frontend

echo "============================================"
echo "ReguPulse AI Compliance Engine"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    lsof -i :$1 >/dev/null 2>&1
    return $?
}

# Stop any existing services
echo -e "${YELLOW}[0/4] Stopping existing services...${NC}"
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "rq worker" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Start Redis
echo -e "${GREEN}[1/4] Starting Redis...${NC}"
docker compose up -d redis
sleep 3

# Start Backend
echo -e "${GREEN}[2/4] Starting Backend API...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..
sleep 5

# Start Worker
echo -e "${GREEN}[3/4] Starting Worker...${NC}"
cd backend
source venv/bin/activate
python -m app.workers.indexing_worker &
WORKER_PID=$!
cd ..
sleep 3

# Start Frontend
echo -e "${GREEN}[4/4] Starting Frontend...${NC}"
cd frontend-main
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo -e "${GREEN}All services started!${NC}"
echo "============================================"
echo ""
echo "📊 Redis:    docker (port 6379)"
echo "🚀 Backend:  http://localhost:8000"
echo "💻 Frontend: http://localhost:3000"
echo "⚙️  Worker:   Running in background"
echo ""
echo "📝 API Docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap Ctrl+C and cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID $WORKER_PID $FRONTEND_PID 2>/dev/null
    docker compose stop redis
    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

trap cleanup INT

# Keep script running
wait

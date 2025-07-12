#!/bin/bash

echo "🚀 AutoHR Development Environment Setup"
echo "======================================"

# Load environment variables if .env exists
if [ -f .env ]; then
    echo "📄 Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default values if not provided
export ASPNETCORE_URLS=${ASPNETCORE_URLS:-"http://localhost:5189;https://localhost:7273"}
export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"http://localhost:5189"}
export FRONTEND_PORT=${FRONTEND_PORT:-3000}
export BACKEND_HTTP_PORT=${BACKEND_HTTP_PORT:-5189}

# Extract ports from ASPNETCORE_URLS for port checking
HTTP_PORT=$(echo $ASPNETCORE_URLS | grep -o 'http://localhost:[0-9]*' | grep -o '[0-9]*$' | head -1)
HTTPS_PORT=$(echo $ASPNETCORE_URLS | grep -o 'https://localhost:[0-9]*' | grep -o '[0-9]*$' | head -1)

# Use extracted ports or defaults
HTTP_PORT=${HTTP_PORT:-5189}
HTTPS_PORT=${HTTPS_PORT:-7273}

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    echo "❌ .NET is not installed. Please install .NET 9.0 SDK"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check for Gmail configuration
echo "🔍 Checking Gmail configuration..."
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "⚠️  Gmail OAuth not configured:"
    echo "   - GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-"❌ Missing"}"
    echo "   - GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-"❌ Missing"}"
    echo "   📄 See dotnet-backend/ai-hr/GMAIL_SETUP.md for setup instructions"
    echo "   📧 Email features will not work without these credentials"
else
    echo "✅ Gmail OAuth configured"
fi

echo ""
echo "📋 Configuration:"
echo "   Backend URLs: $ASPNETCORE_URLS"
echo "   Frontend Port: $FRONTEND_PORT"
echo "   API URL: $NEXT_PUBLIC_API_URL"
echo ""

echo "📋 Available commands:"
echo "1. Start Both Services:  ./start-dev.sh both"
echo "2. Start Backend Only:   ./start-dev.sh backend"
echo "3. Start Frontend Only:  ./start-dev.sh frontend"
echo "4. Check Status:         ./start-dev.sh status"
echo "5. Stop All Services:    ./start-dev.sh stop"
echo ""

case "$1" in
    "both")
        echo "🚀 Starting both Backend and Frontend..."
        echo ""
        
        # Kill any existing processes on these ports
        echo "🧹 Cleaning up existing processes..."
        lsof -ti:$HTTP_PORT | xargs kill -9 2>/dev/null || true
        lsof -ti:$HTTPS_PORT | xargs kill -9 2>/dev/null || true
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        sleep 2
        
        # Start backend in background
        echo "🔧 Starting .NET Backend on $ASPNETCORE_URLS..."
        cd dotnet-backend/ai-hr
        nohup dotnet run --urls="$ASPNETCORE_URLS" > ../../backend.log 2>&1 &
        BACKEND_PID=$!
        echo "Backend started with PID: $BACKEND_PID"
        cd ../..
        
        # Wait a moment for backend to start
        echo "⏳ Waiting for backend to initialize..."
        sleep 5
        
        # Start frontend in background
        echo "🔧 Starting Next.js Frontend on port $FRONTEND_PORT..."
        cd react-frontEnd/ai-hr
        npm install > /dev/null 2>&1
        nohup npm run dev -- -p $FRONTEND_PORT > ../../frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo "Frontend started with PID: $FRONTEND_PID"
        cd ../..
        
        # Save PIDs for later cleanup
        echo $BACKEND_PID > .backend.pid
        echo $FRONTEND_PID > .frontend.pid
        
        echo ""
        echo "✅ Both services are starting up!"
        echo "📊 Checking status in 10 seconds..."
        sleep 10
        
        # Check if services are running
        if lsof -Pi :$HTTP_PORT -sTCP:LISTEN -t >/dev/null ; then
            echo "✅ Backend is running on $NEXT_PUBLIC_API_URL"
        else
            echo "❌ Backend failed to start. Check backend.log for details."
        fi
        
        if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
            echo "✅ Frontend is running on http://localhost:$FRONTEND_PORT"
        else
            echo "❌ Frontend failed to start. Check frontend.log for details."
        fi
        
        echo ""
        echo "🌐 Your applications are ready:"
        echo "   Frontend: http://localhost:$FRONTEND_PORT"
        echo "   Backend:  $NEXT_PUBLIC_API_URL"
        echo "   Swagger:  $NEXT_PUBLIC_API_URL/swagger"
        echo "   Test:     http://localhost:$FRONTEND_PORT/test-connection"
        echo ""
        echo "📝 Logs:"
        echo "   Backend:  tail -f backend.log"
        echo "   Frontend: tail -f frontend.log"
        echo ""
        echo "🛑 To stop all services: ./start-dev.sh stop"
        ;;
    "backend")
        echo "🔧 Starting .NET Backend on $ASPNETCORE_URLS..."
        cd dotnet-backend/ai-hr
        echo "Running: dotnet run --urls=\"$ASPNETCORE_URLS\""
        dotnet run --urls="$ASPNETCORE_URLS"
        ;;
    "frontend")
        echo "🔧 Starting Next.js Frontend on port $FRONTEND_PORT..."
        cd react-frontEnd/ai-hr
        echo "Installing dependencies..."
        npm install
        echo "Running: npm run dev -- -p $FRONTEND_PORT"
        npm run dev -- -p $FRONTEND_PORT
        ;;
    "status")
        echo "📊 Checking service status..."
        if lsof -Pi :$HTTP_PORT -sTCP:LISTEN -t >/dev/null ; then
            echo "✅ Backend is running on port $HTTP_PORT"
        else
            echo "❌ Backend is not running"
        fi
        
        if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
            echo "✅ Frontend is running on port $FRONTEND_PORT"
        else
            echo "❌ Frontend is not running"
        fi
        
        # Show PIDs if available
        if [ -f .backend.pid ]; then
            BACKEND_PID=$(cat .backend.pid)
            if ps -p $BACKEND_PID > /dev/null; then
                echo "📋 Backend PID: $BACKEND_PID"
            fi
        fi
        
        if [ -f .frontend.pid ]; then
            FRONTEND_PID=$(cat .frontend.pid)
            if ps -p $FRONTEND_PID > /dev/null; then
                echo "📋 Frontend PID: $FRONTEND_PID"
            fi
        fi
        ;;
    "stop")
        echo "🛑 Stopping all services..."
        
        # Kill processes by port
        lsof -ti:$HTTP_PORT | xargs kill -9 2>/dev/null || true
        lsof -ti:$HTTPS_PORT | xargs kill -9 2>/dev/null || true
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
        
        # Kill processes by PID if available
        if [ -f .backend.pid ]; then
            BACKEND_PID=$(cat .backend.pid)
            kill -9 $BACKEND_PID 2>/dev/null || true
            rm .backend.pid
        fi
        
        if [ -f .frontend.pid ]; then
            FRONTEND_PID=$(cat .frontend.pid)
            kill -9 $FRONTEND_PID 2>/dev/null || true
            rm .frontend.pid
        fi
        
        echo "✅ All services stopped"
        ;;
    *)
        echo "Usage: $0 {both|backend|frontend|status|stop}"
        echo ""
        echo "🌐 URLs when running:"
        echo "   Frontend: http://localhost:$FRONTEND_PORT"
        echo "   Backend:  $NEXT_PUBLIC_API_URL"
        echo "   Swagger:  $NEXT_PUBLIC_API_URL/swagger"
        echo "   Test:     http://localhost:$FRONTEND_PORT/test-connection"
        echo ""
        echo "💡 Quick start: ./start-dev.sh both"
        echo "📄 Create .env file to customize ports and URLs"
        ;;
esac 
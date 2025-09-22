#!/bin/bash

echo "🚀 Starting TrustLens Platform..."

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "node.*simple-server" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "agent-commands" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Wait for processes to die
sleep 3

# Check if ports are free
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 8000 is still in use. Please run: sudo lsof -ti:8000 | xargs kill -9"
    exit 1
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Port 3000 is still in use. Please run: sudo lsof -ti:3000 | xargs kill -9"
    exit 1
fi

echo "✅ Ports are clear"

# Start API server
echo "🔧 Starting API server on port 8000..."
cd /Users/adityaravi/trustlens/packages/api
node simple-server.js &
API_PID=$!

# Wait for API to start
sleep 3

# Test API
if curl -s http://localhost:8000/api/v1/health > /dev/null; then
    echo "✅ API server is running"
else
    echo "❌ API server failed to start"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

# Start web app
echo "🌐 Starting web application on port 3000..."
cd /Users/adityaravi/trustlens/packages/webapp
npm run dev &
WEB_PID=$!

echo ""
echo "🎉 TrustLens is starting up!"
echo ""
echo "📍 URLs:"
echo "   • Web App: http://localhost:3000"
echo "   • API: http://localhost:8000"
echo ""
echo "🔑 Demo Login:"
echo "   • Email: demo@trustlens.ai"
echo "   • Password: demo1234"
echo ""
echo "📝 Steps:"
echo "   1. Wait 30 seconds for everything to load"
echo "   2. Go to http://localhost:3000"
echo "   3. Click 'Sign In' or go to http://localhost:3000/login"
echo "   4. Click 'Try Demo Account' button"
echo "   5. Click 'Sign in'"
echo "   6. You'll be redirected to the dashboard"
echo "   7. Click 'Analyze' in the sidebar to test content analysis"
echo ""
echo "⏹️  To stop: Press Ctrl+C or run: pkill -f 'simple-server|npm run dev'"

# Wait for user to stop
wait
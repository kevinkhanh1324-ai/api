#!/bin/bash

# Backend Management Script for Smart Child Monitoring

BACKEND_DIR="/Users/phamtrungkien/Downloads/Exe201_Web-main/backend"
PID_FILE="$BACKEND_DIR/server.pid"

case "$1" in
  start)
    echo "🚀 Starting Smart Child Backend..."
    cd "$BACKEND_DIR"
    
    # Check if already running
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️  Backend is already running (PID: $PID)"
        echo "🔗 API: http://localhost:5002"
        exit 1
      else
        rm -f "$PID_FILE"
      fi
    fi
    
    # Start backend in background
    nohup node server.js > server.log 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 2
    
    if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
      echo "✅ Backend started successfully!"
      echo "📋 PID: $(cat "$PID_FILE")"
      echo "🔗 API: http://localhost:5002"
      echo "📝 Logs: $BACKEND_DIR/server.log"
    else
      echo "❌ Failed to start backend"
      rm -f "$PID_FILE"
      exit 1
    fi
    ;;
    
  stop)
    echo "🛑 Stopping Smart Child Backend..."
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        rm -f "$PID_FILE"
        echo "✅ Backend stopped successfully"
      else
        echo "⚠️  Backend is not running"
        rm -f "$PID_FILE"
      fi
    else
      echo "⚠️  No PID file found. Backend may not be running"
    fi
    ;;
    
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
    
  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Backend is running (PID: $PID)"
        echo "🔗 API: http://localhost:5002"
        echo "📝 Logs: $BACKEND_DIR/server.log"
      else
        echo "❌ Backend is not running (stale PID file)"
        rm -f "$PID_FILE"
      fi
    else
      echo "❌ Backend is not running"
    fi
    ;;
    
  logs)
    if [ -f "$BACKEND_DIR/server.log" ]; then
      echo "📝 Backend logs:"
      tail -f "$BACKEND_DIR/server.log"
    else
      echo "❌ No log file found"
    fi
    ;;
    
  *)
    echo "Smart Child Backend Management"
    echo "Usage: $0 {start|stop|restart|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the backend server"
    echo "  stop    - Stop the backend server" 
    echo "  restart - Restart the backend server"
    echo "  status  - Check backend status"
    echo "  logs    - View backend logs"
    exit 1
    ;;
esac

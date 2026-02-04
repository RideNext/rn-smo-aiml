#!/bin/bash

# Start Energy rApp Visualization Demo

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║             Energy Saving rApp - Visualization Demo                       ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Check if port forwarding is running
echo "Checking for Kafka port forwarding..."
nc -z localhost 9092
if [ $? -ne 0 ]; then
    echo "⚠️  Kafka does not seem to be accessible at localhost:9092"
    echo "Please run the following command in a separate terminal:"
    echo "kubectl port-forward svc/kafka-1-kafka-bootstrap 9092:9092 -n ridenext-nonrt"
    echo ""
    read -p "Press Enter once you have started port-forwarding..."
fi

# Start Backend
echo "🚀 Starting Backend (FastAPI)..."
cd ui-visualization/backend
pip install -r requirements.txt > /dev/null 2>&1
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ../..

# Start Frontend
echo "🚀 Starting Frontend (React)..."
cd ui-visualization/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Demo is running!"
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop everything"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

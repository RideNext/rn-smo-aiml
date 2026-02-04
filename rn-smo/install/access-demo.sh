#!/bin/bash

#  ============LICENSE_START===============================================
#  Copyright (C) 2023 Nordix Foundation. All rights reserved.
#  ========================================================================
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#  ============LICENSE_END=================================================

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║             Energy Saving rApp - Access via Port Forward                  ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Starting port forwarding for visualization services..."
echo ""

# Get the Kubernetes host IP
KUBE_HOST=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

echo "📊 Access Options:"
echo ""
echo "Option 1: Direct NodePort Access (from Kubernetes host or same network)"
echo "   Frontend: http://${KUBE_HOST}:31801"
echo "   Backend:  http://${KUBE_HOST}:31800"
echo ""
echo "Option 2: Port Forward (from any machine with kubectl access)"
echo "   Starting port forwarding now..."
echo ""

# Start port forwarding in background
kubectl port-forward svc/visualization-frontend 8080:80 -n ridenext-nonrt --address=0.0.0.0 &
PF_FRONTEND_PID=$!

sleep 2

echo ""
echo "✅ Port forwarding active!"
echo ""
echo "   Frontend: http://localhost:8080"
echo "   (Backend is proxied through frontend nginx)"
echo ""
echo "👉 Open http://localhost:8080 in your browser"
echo ""
echo "Press Ctrl+C to stop port forwarding"
echo ""

# Wait for interrupt
trap "kill $PF_FRONTEND_PID 2>/dev/null; echo 'Port forwarding stopped'; exit" INT TERM
wait

#!/bin/bash

#  ============LICENSE_START===============================================
#  Copyright (C) 2024 OpenInfra Foundation Europe. All rights reserved.
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
#

ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd "${ROOT_DIR}"

LOG_DIR="${ROOT_DIR}/../LOGS/deploy-rapp-demo-Logs/"

if [ ! -d "$LOG_DIR" ]; then
	    mkdir -p "$LOG_DIR"
fi

# Log file
LOG_FILE="${LOG_DIR}/deploy-rapp-demo-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "${LOG_FILE}"
}

log "========================================================================="
log "Deploying Energy Saving rApp Demo"
log "Log file: ${LOG_FILE}"
log "========================================================================="

# Check prerequisites
for cmd in kubectl docker; do
    if ! command -v $cmd &> /dev/null; then
        log "Error: Required command not found: $cmd"
        exit 1
    fi
done

# Verify ridenext-nonrt namespace exists
if ! kubectl get namespace ridenext-nonrt &> /dev/null; then
    log "Error: ridenext-nonrt namespace not found."
    exit 1
fi
log "✓ ridenext-nonrt namespace exists"

# Verify Kafka is running
if ! kubectl get kafka kafka-1 -n ridenext-nonrt &> /dev/null; then
    log "Error: Kafka not found in ridenext-nonrt namespace."
    exit 1
fi
log "✓ Kafka cluster found"

# Verify Policy Management Service is running
if ! kubectl get svc policymanagementservice -n ridenext-nonrt &> /dev/null; then
    log "Error: Policy Management Service not found."
    exit 1
fi
log "✓ Policy Management Service found"

# Deploy Energy Saving rApp & Visualization
log "\nDeploying Energy Saving rApp & Visualization..."

RAPP_DIR="${ROOT_DIR}/../es-rapp"
UI_BACKEND_DIR="${ROOT_DIR}/../ui-visualization/backend"
UI_FRONTEND_DIR="${ROOT_DIR}/../ui-visualization/frontend"

# Check directories
if [ ! -d "$RAPP_DIR" ]; then log "Error: $RAPP_DIR not found"; exit 1; fi
if [ ! -d "$UI_BACKEND_DIR" ]; then log "Error: $UI_BACKEND_DIR not found"; exit 1; fi
if [ ! -d "$UI_FRONTEND_DIR" ]; then log "Error: $UI_FRONTEND_DIR not found"; exit 1; fi

# Build and Push Function
build_and_push() {
    NAME=$1
    DIR=$2
    TAG="localhost:5000/${NAME}:latest"
    log "Building ${NAME}..."
    docker build -t ${TAG} ${DIR} 2>&1 | tee -a "${LOG_FILE}"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then log "Error: Failed to build ${NAME}"; return 1; fi
    
    log "Pushing ${NAME}..."
    docker push ${TAG} 2>&1 | tee -a "${LOG_FILE}"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then log "Error: Failed to push ${NAME}"; return 1; fi
    return 0
}

# Build and Push Function with Custom Dockerfile
build_and_push_custom() {
    NAME=$1
    DIR=$2
    DOCKERFILE=$3
    TAG="localhost:5000/${NAME}:latest"
    log "Building ${NAME}..."
    docker build -f "${DIR}/${DOCKERFILE}" -t ${TAG} ${DIR} 2>&1 | tee -a "${LOG_FILE}"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then log "Error: Failed to build ${NAME}"; return 1; fi
    
    log "Pushing ${NAME}..."
    docker push ${TAG} 2>&1 | tee -a "${LOG_FILE}"
    if [ ${PIPESTATUS[0]} -ne 0 ]; then log "Error: Failed to push ${NAME}"; return 1; fi
    return 0
}

# Deploy rApp
log "\n1. Deploying Simple Energy rApp..."
build_and_push "simple-energy-rapp" "$RAPP_DIR" || exit 1
kubectl apply -f "${RAPP_DIR}/deployment.yaml"
log "✓ Simple Energy rApp deployed"

# Deploy PM Data Producer
log "\n1.5. Deploying PM Data Producer..."
build_and_push_custom "pm-data-producer" "$RAPP_DIR" "Dockerfile.producer" || exit 1
kubectl delete job pm-data-producer -n ridenext-nonrt --ignore-not-found=true
kubectl apply -f "${RAPP_DIR}/producer-job.yaml"
log "✓ PM Data Producer deployed"

# Deploy UI Backend
log "\n2. Deploying Visualization Backend..."
build_and_push "visualization-backend" "$UI_BACKEND_DIR" || exit 1
kubectl apply -f "${UI_BACKEND_DIR}/deployment.yaml"
log "✓ Visualization Backend deployed"

# Deploy UI Frontend
log "\n3. Deploying Visualization Frontend..."
build_and_push "visualization-frontend" "$UI_FRONTEND_DIR" || exit 1
kubectl apply -f "${UI_FRONTEND_DIR}/deployment.yaml"
log "✓ Visualization Frontend deployed"

# Wait for pods
log "\nWaiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=simple-energy-rapp -n ridenext-nonrt --timeout=300s
kubectl wait --for=condition=ready pod -l app=visualization-backend -n ridenext-nonrt --timeout=300s
kubectl wait --for=condition=ready pod -l app=visualization-backend -n ridenext-nonrt --timeout=300s
kubectl wait --for=condition=ready pod -l app=visualization-frontend -n ridenext-nonrt --timeout=300s
kubectl wait --for=condition=ready pod -l job-name=pm-data-producer -n ridenext-nonrt --timeout=300s

# Ensure policy script is executable
chmod +x "${ROOT_DIR}/create-energy-policies.sh"

log "\n========================================================================="
log "Energy Saving rApp Demo Deployment Completed Successfully!"
log "========================================================================="
log "Deployed components:"
log "  ✓ Simple Energy rApp"
log "  ✓ Visualization Backend"
log "  ✓ Visualization Frontend"
log ""
log "Next steps to run the demo:"
log "1. Open 4 terminals."
log "2. In Terminal 1 (Backend Tunnel):"
log "   kubectl port-forward svc/visualization-backend 8000:8000 -n ridenext-nonrt"
log "3. In Terminal 2 (Frontend Tunnel):"
log "   kubectl port-forward svc/visualization-frontend 5173:80 -n ridenext-nonrt"
log "4. In Terminal 3 (A1PMS Tunnel):"
log "   kubectl port-forward svc/policymanagementservice 31850:8081 -n ridenext-nonrt"
log "5. In Terminal 4 (Policy Creation):"
log "   cd ${ROOT_DIR}"
log "   ./create-energy-policies.sh"
log ""
log "6. Access the UI at http://localhost:5173"
log ""
log "Log file: ${LOG_FILE}"

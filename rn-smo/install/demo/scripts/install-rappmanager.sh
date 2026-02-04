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

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
DEMO_DIR="$(dirname "$SCRIPT_DIR")"
HELM_DIR="${DEMO_DIR}/helm/rappmanager"

NAMESPACE="ridenext-nonrt"

echo "Installing rApp Manager..."

# Check if namespace exists
if ! kubectl get namespace ${NAMESPACE} &> /dev/null; then
    echo "Creating namespace ${NAMESPACE}..."
    kubectl create namespace ${NAMESPACE}
fi

# Check if helm chart exists
if [ ! -d "${HELM_DIR}" ]; then
    echo "Error: Helm chart not found at ${HELM_DIR}"
    exit 1
fi

# Install or upgrade rApp Manager
echo "Deploying rApp Manager using Helm..."
helm upgrade --install rappmanager ${HELM_DIR} \
    --namespace ${NAMESPACE} \
    --wait \
    --timeout 5m

if [ $? -eq 0 ]; then
    echo "✓ rApp Manager installed successfully"
    
    echo ""
    echo "Waiting for rApp Manager to be ready..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=rappmanager -n ${NAMESPACE} --timeout=300s
    
    if [ $? -eq 0 ]; then
        echo "✓ rApp Manager is ready"
        echo ""
        echo "Service details:"
        kubectl get svc -n ${NAMESPACE} | grep rappmanager
        echo ""
        echo "Pod status:"
        kubectl get pods -n ${NAMESPACE} | grep rappmanager
    else
        echo "⚠ rApp Manager pod is not ready yet. Check status with:"
        echo "  kubectl get pods -n ${NAMESPACE} | grep rappmanager"
    fi
else
    echo "✗ Failed to install rApp Manager"
    exit 1
fi

echo ""
echo "To access rApp Manager:"
echo "  NodePort: http://<node-ip>:30080"
echo "  Or get node IP: kubectl get nodes -o wide"
echo "  Alternative: kubectl port-forward svc/rappmanager 8080:8080 -n ${NAMESPACE}"

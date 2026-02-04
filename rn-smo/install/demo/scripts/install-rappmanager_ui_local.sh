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
HELM_DIR="${DEMO_DIR}/helm/rappmanager_ui_local"

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
helm upgrade --install rappmanagerui ${HELM_DIR} \
    --namespace ${NAMESPACE} 

if [ $? -eq 0 ]; then
    echo "✓ rApp Manager ui pod installed successfully"
    
fi

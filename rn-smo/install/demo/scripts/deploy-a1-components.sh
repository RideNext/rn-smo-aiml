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

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "${ROOT_DIR}"

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║             Deploying Non-RT RIC A1 Components                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"

# Generic error printout function
check_error() {
    if [ $1 -ne 0 ]; then
        echo "Failed: $2"
        echo "Exiting..."
        exit 1
    fi
}

echo ""
echo "📋 Components to be deployed:"
echo "   1. A1 Policy Management Service (A1PMS)"
echo "   2. A1 Simulators (2x Near-RT RIC simulators)"
echo ""

##################################################################################
echo "##### Installing: A1 Policy Management Service"
##################################################################################

# Generate certificates for A1PMS
echo "Generating A1PMS certificates..."
./scripts/generate-a1pms-certs.sh
check_error $? "Failed to generate A1PMS certificates"

# Clean up existing A1PMS to avoid potential conflicts
echo "Cleaning up any existing A1 Policy Management Service..."
kubectl delete -f deployments/a1pms-deployment.yaml --ignore-not-found=true -n ridenext-nonrt
sleep 2

kubectl apply -f deployments/a1pms-deployment.yaml
check_error $? "Failed to deploy A1 Policy Management Service"

echo "✅ A1 Policy Management Service deployed successfully"
echo ""

##################################################################################
echo "##### Installing: A1 Simulators (Near-RT RIC Simulators)"
##################################################################################

# Clean up existing simulators to avoid immutable selector errors
echo "Cleaning up any existing A1 simulators..."
kubectl delete -f deployments/a1sim-deployment.yaml --ignore-not-found=true -n ridenext-nonrt
# Wait a moment for deletion to propagate
sleep 5

kubectl apply -f deployments/a1sim-deployment.yaml
check_error $? "Failed to deploy A1 Simulators"

echo "✅ A1 Simulators deployed successfully"
echo ""

echo "⏳ Waiting for all A1 components to be ready..."
kubectl wait --for=condition=ready pod -l app=policymanagementservice -n ridenext-nonrt --timeout=120s
kubectl wait --for=condition=ready pod -l app=a1-sim -n ridenext-nonrt --timeout=120s

echo ""
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                    A1 Components Deployment Complete!                     ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Deployed Components:"
echo ""

# Get pod information
kubectl get pods -n ridenext-nonrt | grep -E "(policymanagement|a1-sim)"

echo ""

# Get service information
echo "📡 Services:"
kubectl get svc -n ridenext-nonrt | grep -E "(policymanagement|a1-sim)"

echo ""

# Get Kubernetes host
KUBE_HOST=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

echo "🔍 A1 Policy Management Service API:"
echo "   Internal: http://policymanagementservice.ridenext-nonrt:8081"
echo "   External: http://${KUBE_HOST}:31850"
echo ""
echo "🔍 A1 Simulators (Near-RT RICs):"
echo "   RIC 1: http://a1-sim-osc-0.ridenext-nonrt:8085"
echo "   RIC 2: http://a1-sim-osc-1.ridenext-nonrt:8085"
echo ""
echo "🎯 Next Steps:"
echo "   1. Verify deployment: kubectl get pods -n ridenext-nonrt | grep -E '(a1|policy)'"
echo "   2. Check A1PMS status: curl http://${KUBE_HOST}:31850/status"
echo "   3. Register Near-RT RICs with A1PMS"
echo "   4. Deploy policy types to A1 Simulators"
echo "   5. Create and deploy A1 policies via A1PMS API"
echo ""
echo "📚 A1PMS API Documentation:"
echo "   Swagger UI: http://${KUBE_HOST}:31850/swagger-ui.html"
echo "   API Docs: http://${KUBE_HOST}:31850/v3/api-docs"
echo ""
echo "📝 Example: Register a Near-RT RIC with A1PMS:"
echo "   curl -X PUT http://${KUBE_HOST}:31850/a1-policy/v2/rics/ric?managedElementIds=me1 \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"ricId\":\"ric1\",\"managedElementIds\":[\"me1\"],\"policyTypeIds\":[],\"baseUrl\":\"http://a1-sim-osc-0.ridenext-nonrt:8085\"}'"
echo ""

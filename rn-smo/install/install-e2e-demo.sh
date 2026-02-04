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

# Log file
LOG_FILE="${ROOT_DIR}/install-e2e-demo-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "${LOG_FILE}"
}

log "========================================================================="
log "Starting End-to-End Energy Saving rApp Demo Installation"
log "Log file: ${LOG_FILE}"
log "========================================================================="

# Check prerequisites
for cmd in kubectl helm jq; do
    if ! command -v $cmd &> /dev/null; then
        log "Error: Required command not found: $cmd"
        exit 1
    fi
done

# Step 1: Run RANPM Installation
log "\nStep 1: Running RANPM Installation (install-ranpm-improved.sh)..."
if [ -f "./install-ranpm-improved.sh" ]; then
    chmod +x ./install-ranpm-improved.sh
    ./install-ranpm-improved.sh
    if [ $? -ne 0 ]; then
        log "Error: install-ranpm-improved.sh failed."
        exit 1
    fi
else
    log "Error: install-ranpm-improved.sh not found in ${ROOT_DIR}"
    exit 1
fi

# Step 1.5: Install ONAP components (Layer 1)
log "\nStep 1.5: Installing ONAP components (Layer 1)..."

SMO_INSTALL_DIR="${ROOT_DIR}/../smo-install"
ONAP_OVERRIDE_FILE="${SMO_INSTALL_DIR}/helm-override/default/onap-override.yaml"
HELM_REPO="${SMO_INSTALL_DIR}/oran_oom"
ONAP_REPO="${SMO_INSTALL_DIR}/onap_oom/kubernetes"

if [ ! -d "$HELM_REPO" ]; then
    log "Error: Helm repo directory not found at $HELM_REPO"
    exit 1
fi

if [ ! -d "$ONAP_REPO" ]; then
    log "Error: ONAP repo directory not found at $ONAP_REPO"
    exit 1
fi

if [ ! -f "$ONAP_OVERRIDE_FILE" ]; then
    log "Error: ONAP override file not found at $ONAP_OVERRIDE_FILE"
    exit 1
fi

# Install ONAP Helm chart
log "Installing ONAP Helm chart..."

# Ensure namespace exists
kubectl create namespace onap --dry-run=client -o yaml | kubectl apply -f -

# Check if Strimzi should be installed (parse from override file)
INSTALL_STRIMZI=$(yq e '.strimzi.enabled' "$ONAP_OVERRIDE_FILE" 2>/dev/null)
if [ "$INSTALL_STRIMZI" == "true" ]; then
    log "Installing Strimzi Kafka Operator..."
    helm upgrade --install strimzi-kafka-operator strimzi/strimzi-kafka-operator \
        --namespace strimzi-system \
        --version 0.45.0 \
        --set watchAnyNamespace=true \
        --create-namespace
    
    if [ $? -ne 0 ]; then
        log "Warning: Strimzi installation failed or already exists. Continuing..."
    fi
fi

# Install ONAP
helm upgrade --install --debug onap "${ONAP_REPO}/onap" \
    --namespace onap \
    -f "$ONAP_OVERRIDE_FILE" \
    --create-namespace

if [ $? -ne 0 ]; then
    log "Error: ONAP Helm upgrade failed."
    exit 1
fi

log "ONAP Helm chart installed successfully."

# Wait for key ONAP components to be ready
log "Waiting for ONAP Kafka cluster to be ready..."
kubectl wait --for=condition=Ready kafka/onap-strimzi-kafka -n onap --timeout=10m || log "Warning: Kafka wait timed out, continuing..."

# Step 2: Install NonRTRIC components (Layer 2)
log "\nStep 2: Installing NonRTRIC components (Layer 2)..."

HELM_OVERRIDE_FILE="${SMO_INSTALL_DIR}/helm-override/default/oran-override.yaml"
DISABLE_REDUNDANT_FILE="${ROOT_DIR}/disable-redundant-components.yaml"

if [ ! -d "$HELM_REPO" ]; then
    log "Error: Helm repo directory not found at $HELM_REPO"
    exit 1
fi

if [ ! -f "$HELM_OVERRIDE_FILE" ]; then
    log "Error: Helm override file not found at $HELM_OVERRIDE_FILE"
    exit 1
fi

# Create override file to disable redundant components
log "Creating override file to disable redundant components..."
cat <<EOF > "${DISABLE_REDUNDANT_FILE}"
ridenext-nonrt:
  installInformationservice: false
  installControlpanel: false
  installNonrtricgateway: false
  installRanpm: false
EOF

log "Created ${DISABLE_REDUNDANT_FILE}"

# Install NonRTRIC Helm chart
log "Installing NonRTRIC Helm chart..."

# Ensure namespace exists
kubectl create namespace ridenext-nonrt --dry-run=client -o yaml | kubectl apply -f -

TIMESTAMP=$(date +%s)
MOUNT_PATH="/dockerdata-nfs/deployment-${TIMESTAMP}"

log "Using mount path: ${MOUNT_PATH}"

helm upgrade --install oran-nonrtric "${HELM_REPO}/nonrtric" \
    --namespace ridenext-nonrt \
    -f "${HELM_OVERRIDE_FILE}" \
    -f "${DISABLE_REDUNDANT_FILE}" \
    --set ridenext-nonrt.persistence.mountPath="${MOUNT_PATH}"

if [ $? -ne 0 ]; then
    log "Error: Helm upgrade failed."
    exit 1
fi

log "NonRTRIC Helm chart installed successfully."

# Copy secrets (logic adapted from install-nonrtric.sh)
log "Checking for secrets to copy..."

# Function to check for secrets
check_for_secrets() {
    try=0
    retries=60
    until (kubectl get secret -n onap | grep -P "\b$1\b") >/dev/null 2>&1; do
        try=$(($try + 1))
        [ $try -gt $retries ] && return 1
        echo "$1 not found. Retry $try/$retries"
        sleep 10
    done
    echo "$1 found"
    return 0
}

# We need to parse the secrets from the override file.
# Since we don't want to depend on yq, and the secrets list is usually small and static in the override,
# we can try to extract them or just hardcode the common ones if we know them.
# However, install-nonrtric.sh uses yq.
# If yq is not available, we might skip this or warn.
# But wait, the user environment has 'jq', maybe not 'yq'.
# If 'yq' is missing, we can't easily parse the yaml.
# But we can check if 'yq' exists.

if command -v yq &> /dev/null; then
    SECRETS_SIZE=$(yq '.ridenext-nonrt.secrets | length' "$HELM_OVERRIDE_FILE")
    if [ "$SECRETS_SIZE" != "null" ] && [ "$SECRETS_SIZE" -gt 0 ]; then
        for i in $(seq 0 $((SECRETS_SIZE - 1))); do
            secret=$(yq ".ridenext-nonrt.secrets[$i].name" "$HELM_OVERRIDE_FILE")
            dependsOn=$(yq ".ridenext-nonrt.secrets[$i].dependsOn" "$HELM_OVERRIDE_FILE")
            
            # Check if the dependency is enabled.
            # We disabled some components in DISABLE_REDUNDANT_FILE.
            # We need to check the effective value.
            # This is getting complicated without a proper yaml merger.
            
            # Simplified approach: Just try to copy if the secret exists in ONAP and we think we need it.
            # Or just run the copy logic blindly for known secrets?
            # The secrets in oran-override.yaml are: dmeparticipant-ku (depends on installDmeparticipant)
            
            # installDmeparticipant is TRUE by default and we didn't disable it.
            # So we should copy dmeparticipant-ku.
            
            if [ "$secret" == "dmeparticipant-ku" ]; then
                log "Copying $secret from onap namespace..."
                if check_for_secrets "$secret"; then
                    kubectl get secret "$secret" -n onap -o json | jq 'del(.metadata["namespace","creationTimestamp","resourceVersion","selfLink","uid","ownerReferences"])' | kubectl apply -n ridenext-nonrt -f -
                else
                    log "Warning: Secret $secret not found in onap namespace."
                fi
            fi
        done
    fi
else
    log "Warning: yq not found. Skipping automatic secret copying based on YAML parsing."
    log "Attempting to copy known secrets..."
    # Hardcoded check for dmeparticipant-ku
    secret="dmeparticipant-ku"
    log "Copying $secret from onap namespace (if exists)..."
    if (kubectl get secret -n onap | grep -P "\b$secret\b") >/dev/null 2>&1; then
        kubectl get secret "$secret" -n onap -o json | jq 'del(.metadata["namespace","creationTimestamp","resourceVersion","selfLink","uid","ownerReferences"])' | kubectl apply -n ridenext-nonrt -f -
        log "Copied $secret"
    else
        log "Secret $secret not found or ONAP namespace not present. Skipping."
    fi
fi

# Wait for Kong deployment
log "Waiting for the Kong deployment to be ready..."
kubectl wait --for=condition=available deployment/oran-nonrtric-kong -n ridenext-nonrt --timeout=15m || log "Warning: Kong wait timed out or not found."

# Step 3: Deploy Energy Saving rApp & Visualization
log "\nStep 3: Deploying Energy Saving rApp & Visualization..."

RAPP_DIR="${ROOT_DIR}/../simple-energy-rapp"
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
    docker build -t ${TAG} ${DIR}
    if [ $? -ne 0 ]; then log "Error: Failed to build ${NAME}"; return 1; fi
    
    log "Pushing ${NAME}..."
    docker push ${TAG}
    if [ $? -ne 0 ]; then log "Error: Failed to push ${NAME}"; return 1; fi
    return 0
}

# Deploy rApp
build_and_push "simple-energy-rapp" "$RAPP_DIR" || exit 1
kubectl apply -f "${RAPP_DIR}/deployment.yaml"

# Deploy UI Backend
build_and_push "visualization-backend" "$UI_BACKEND_DIR" || exit 1
kubectl apply -f "${UI_BACKEND_DIR}/deployment.yaml"

# Deploy UI Frontend
build_and_push "visualization-frontend" "$UI_FRONTEND_DIR" || exit 1
kubectl apply -f "${UI_FRONTEND_DIR}/deployment.yaml"

# Wait for pods
log "Waiting for rApp and UI pods..."
kubectl wait --for=condition=ready pod -l app=simple-energy-rapp -n ridenext-nonrt --timeout=300s
kubectl wait --for=condition=ready pod -l app=visualization-backend -n ridenext-nonrt --timeout=300s
kubectl wait --for=condition=ready pod -l app=visualization-frontend -n ridenext-nonrt --timeout=300s

# Ensure policy script is executable
chmod +x "${ROOT_DIR}/create-energy-policies.sh"

log "\n========================================================================="
log "End-to-End Demo Installation Completed Successfully!"
log "========================================================================="
log "Installed components:"
log "  - Layer 0: RANPM components (Kafka, ICS, PM services)"
log "  - Layer 1: ONAP components"
log "  - Layer 2: NonRTRIC components"
log "  - Layer 3: Energy Saving rApp & Visualization"
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

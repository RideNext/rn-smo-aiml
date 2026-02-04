#!/bin/bash

set -x 

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

# This script installs only the missing NonRTRIC components needed for Energy Saving rApp
# It assumes Kafka and basic RANPM components are already installed in nonrtric namespace

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "${ROOT_DIR}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LOG_DIR="${ROOT_DIR}/LOGS/install-nonrtric-only-Logs/"

if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
fi

# Log file
LOG_FILE="${LOG_DIR}/install-nonrtric-only-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "${LOG_FILE}"
}

log "${GREEN}=========================================================================${NC}"
log "${GREEN}Installing NonRTRIC Components for Energy Saving rApp Demo${NC}"
log "${GREEN}Log file: ${LOG_FILE}${NC}"
log "${GREEN}=========================================================================${NC}"

# Check prerequisites
log "\n${YELLOW}Checking prerequisites...${NC}"
for cmd in kubectl helm; do
    if ! command -v $cmd &> /dev/null; then
        log "${RED}✗ Required command not found: $cmd${NC}"
        exit 1
    fi
    log "${GREEN}✓ Found: $cmd${NC}"
done

# Verify ridenext-nonrt namespace exists
if ! kubectl get namespace ridenext-nonrt &> /dev/null; then
    log "${RED}✗ ridenext-nonrt namespace not found. Please run install-ranpm-improved.sh first.${NC}"
    exit 1
fi
log "${GREEN}✓ ridenext-nonrt namespace exists${NC}"

# Verify Kafka is running
if ! kubectl get kafka kafka-1 -n ridenext-nonrt &> /dev/null; then
    log "${RED}✗ Kafka not found in ridenext-nonrt namespace. Please run install-ranpm-improved.sh first.${NC}"
    exit 1
fi
log "${GREEN}✓ Kafka cluster found${NC}"

# Set up paths
SMO_INSTALL_DIR="${ROOT_DIR}/../../smo-install"
HELM_OVERRIDE_FILE="${SMO_INSTALL_DIR}/helm-override/default/oran-override.yaml"
HELM_REPO="${SMO_INSTALL_DIR}/oran_oom"
CUSTOM_OVERRIDE="${ROOT_DIR}/config/nonrtric-no-onap-override.yaml"

# Validate paths
if [ ! -d "$HELM_REPO" ]; then
    log "${RED}✗ Helm repo directory not found at $HELM_REPO${NC}"
    exit 1
fi
log "${GREEN}✓ Helm repo found${NC}"

if [ ! -f "$HELM_OVERRIDE_FILE" ]; then
    log "${RED}✗ Helm override file not found at $HELM_OVERRIDE_FILE${NC}"
    exit 1
fi
log "${GREEN}✓ Helm override file found${NC}"

if [ ! -f "$CUSTOM_OVERRIDE" ]; then
    log "${RED}✗ Custom override file not found at $CUSTOM_OVERRIDE${NC}"
    log "${YELLOW}Please ensure nonrtric-no-onap-override.yaml exists${NC}"
    exit 1
fi
log "${GREEN}✓ Custom override file found${NC}"

# Install NonRTRIC components
log "\n${GREEN}=========================================================================${NC}"
log "${GREEN}Installing NonRTRIC Components${NC}"
log "${GREEN}=========================================================================${NC}"

TIMESTAMP=$(date +%s)
MOUNT_PATH="/dockerdata-nfs/deployment-${TIMESTAMP}"

log "${YELLOW}Using mount path: ${MOUNT_PATH}${NC}"
log "${YELLOW}Creating mount path directory...${NC}"
sudo mkdir -p "${MOUNT_PATH}"
sudo chmod 777 "${MOUNT_PATH}"
log "${GREEN}✓ Mount path created${NC}"

log "${YELLOW}Installing with custom overrides to skip ONAP dependencies...${NC}"

# Clean up any existing A1 simulators that might conflict with Helm
log "${YELLOW}Cleaning up potential conflicting A1 simulator deployments...${NC}"
kubectl delete deployment a1-sim-osc-0 a1-sim-osc-1 a1-sim-std-0 a1-sim-std-1 a1-sim-std2-0 a1-sim-std2-1 -n ridenext-nonrt --ignore-not-found=true
kubectl delete service a1-sim-osc-0 a1-sim-osc-1 a1-sim-std-0 a1-sim-std-1 a1-sim-std2-0 a1-sim-std2-1 -n ridenext-nonrt --ignore-not-found=true
sleep 5

helm upgrade --install oran-nonrtric "${HELM_REPO}/nonrtric" \
    --namespace ridenext-nonrt \
    -f "${HELM_OVERRIDE_FILE}" \
    -f "${CUSTOM_OVERRIDE}" \
    --set ridenext-nonrt.persistence.mountPath="${MOUNT_PATH}"

if [ $? -ne 0 ]; then
    log "${RED}✗ Helm upgrade failed.${NC}"
    log "${YELLOW}Check the log file for details: ${LOG_FILE}${NC}"
    exit 1
fi

log "${GREEN}✓ NonRTRIC Helm chart installed successfully${NC}"

# Wait for Kong deployment (if installed)
log "\n${YELLOW}Waiting for Kong deployment to be ready...${NC}"
if kubectl get deployment oran-nonrtric-kong -n ridenext-nonrt &> /dev/null; then
    kubectl wait --for=condition=available deployment/oran-nonrtric-kong -n ridenext-nonrt --timeout=15m
    if [ $? -eq 0 ]; then
        log "${GREEN}✓ Kong deployment is ready${NC}"
    else
        log "${YELLOW}⚠ Kong deployment wait timed out, but continuing...${NC}"
    fi
else
    log "${YELLOW}⚠ Kong deployment not found, skipping wait${NC}"
fi

# Show pod status
log "\n${GREEN}=========================================================================${NC}"
log "${GREEN}Current Pod Status in ridenext-nonrt namespace:${NC}"
log "${GREEN}=========================================================================${NC}"
kubectl get pods -n ridenext-nonrt | tee -a "${LOG_FILE}"

log "\n${GREEN}=========================================================================${NC}"
log "${GREEN}Installation Completed!${NC}"
log "${GREEN}=========================================================================${NC}"
log "${YELLOW}Next steps:${NC}"
log "1. Verify all pods are running: ${GREEN}kubectl get pods -n ridenext-nonrt${NC}"
log "2. Check for any pods in CrashLoopBackOff or Error state"
log "3. Deploy your Energy Saving rApp"
log "\n${YELLOW}Log file saved to: ${LOG_FILE}${NC}"

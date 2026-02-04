#!/bin/bash

set -x

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
#
# IMPROVED VERSION with better error handling and status checks

# Get the parent directory (demo/) instead of scripts/
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "${ROOT_DIR}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

LOG_DIR="${ROOT_DIR}/LOGS/install-ranpm-Logs/"

if [ ! -d "$LOG_DIR" ]; then
   mkdir -p "$LOG_DIR"
fi


# Log file
LOG_FILE="${LOG_DIR}/install-ranpm-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "${LOG_FILE}"
}

# Function to check if a script has already been run successfully
is_completed() {
    local script=$1
    local marker_file="${ROOT_DIR}/.${script}.completed"
    [ -f "${marker_file}" ]
}

# Function to mark a script as completed
mark_completed() {
    local script=$1
    local marker_file="${ROOT_DIR}/.${script}.completed"
    touch "${marker_file}"
}

# Function to wait for Kafka cluster to be ready
wait_for_kafka() {
    log "${YELLOW}Waiting for Kafka cluster to be ready...${NC}"
    local max_wait=300
    local elapsed=0
    
    while [ $elapsed -lt $max_wait ]; do
        if kubectl get kafka kafka-1 -n ridenext-nonrt -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null | grep -q "True"; then
            log "${GREEN}✓ Kafka cluster is ready${NC}"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo -n "."
    done
    
    log "${RED}✗ Kafka cluster failed to become ready within ${max_wait} seconds${NC}"
    return 1
}

# Function to check if Strimzi operator is running
check_strimzi_operator() {
    log "${YELLOW}Checking Strimzi operator status...${NC}"
    if kubectl get pods -n ridenext-nonrt -l name=strimzi-cluster-operator --no-headers 2>/dev/null | grep -q "Running"; then
        log "${GREEN}✓ Strimzi operator is running${NC}"
        return 0
    else
        log "${RED}✗ Strimzi operator is not running${NC}"
        return 1
    fi
}

# Function to check pod status
check_pods() {
    local namespace=$1
    log "${YELLOW}Checking pods in namespace ${namespace}...${NC}"
    kubectl get pods -n ${namespace} | tee -a "${LOG_FILE}"
}

# Array of installation scripts
# Array of installation scripts
scripts=("scripts/install-nrt.sh" "scripts/install-pm-log.sh" "scripts/install-pm-influx-job.sh" "scripts/install-pm-rapp.sh" "scripts/install-pm-kafka-bridge.sh" "scripts/fix-oauth-authentication.sh")

log "${GREEN}=========================================================================${NC}"
log "${GREEN}Starting RANPM Installation${NC}"
log "${GREEN}Log file: ${LOG_FILE}${NC}"
log "${GREEN}=========================================================================${NC}"

# Check prerequisites
log "\n${YELLOW}Checking prerequisites...${NC}"
for cmd in kubectl helm envsubst jq; do
    if ! command -v $cmd &> /dev/null; then
        log "${RED}✗ Required command not found: $cmd${NC}"
        exit 1
    fi
    log "${GREEN}✓ Found: $cmd${NC}"
done

# Run each installation script
for script in "${scripts[@]}"; do
    log "\n${GREEN}=========================================================================${NC}"
    log "${GREEN}Processing: ${script}${NC}"
    log "${GREEN}=========================================================================${NC}"
    
    # Skip if already completed
    if is_completed "${script}"; then
        log "${YELLOW}⊙ ${script} already completed, skipping...${NC}"
        continue
    fi
    
    # Make script executable
    chmod +x "${ROOT_DIR}/${script}"
    
    # Special handling for install-nrt.sh (includes Strimzi operator)
    if [ "${script}" == "install-nrt.sh" ]; then
        log "${YELLOW}Running ${script}...${NC}"
        "${ROOT_DIR}/${script}" 2>&1 | tee -a "${LOG_FILE}"
        script_exit_code=${PIPESTATUS[0]}
        
        if [ $script_exit_code -eq 0 ]; then
            log "${GREEN}✓ ${script} completed successfully${NC}"
            mark_completed "${script}"
            
            # Wait for Kafka cluster to be ready
            if ! wait_for_kafka; then
                log "${RED}✗ Kafka cluster failed to become ready${NC}"
                log "${YELLOW}You can check the status with: kubectl get kafka -n ridenext-nonrt${NC}"
                log "${YELLOW}And check operator logs with: kubectl logs -n ridenext-nonrt -l name=strimzi-cluster-operator${NC}"
                exit 1
            fi
            
            # Check pod status
            check_pods "ridenext-nonrt"
        else
            log "${RED}✗ ${script} failed with exit code ${script_exit_code}${NC}"
            
            # Check if Strimzi operator is the issue
            if ! check_strimzi_operator; then
                log "${YELLOW}Attempting to fix Strimzi operator issue...${NC}"
                log "${YELLOW}You may need to manually install Strimzi operator${NC}"
                log "${YELLOW}See kafka_troubleshooting.md for details${NC}"
            fi
            
            exit 1
        fi
    else
        # Run other scripts normally
        log "${YELLOW}Running ${script}...${NC}"
        "${ROOT_DIR}/${script}" 2>&1 | tee -a "${LOG_FILE}"
        script_exit_code=${PIPESTATUS[0]}
        
        if [ $script_exit_code -eq 0 ]; then
            log "${GREEN}✓ ${script} completed successfully${NC}"
            mark_completed "${script}"
        else
            log "${RED}✗ ${script} failed with exit code ${script_exit_code}${NC}"
            log "${YELLOW}Check the log file for details: ${LOG_FILE}${NC}"
            log "${YELLOW}You can resume installation by running this script again${NC}"
            exit 1
        fi
    fi
done

log "\n${GREEN}=========================================================================${NC}"
log "${GREEN}All RANPM installation scripts executed successfully!${NC}"
log "${GREEN}=========================================================================${NC}"
log "\n${YELLOW}Next steps:${NC}"
log "1. Verify all pods are running: ${GREEN}kubectl get pods -n ridenext-nonrt${NC}"
log "2. Check Kafka topics: ${GREEN}kubectl exec -n ridenext-nonrt kafka-client -- kafka-topics --list --bootstrap-server kafka-1-kafka-bootstrap.ridenext-nonrt:9092${NC}"
log "3. Deploy Energy Saving rApp: See energy_saving_rapp_deployment.md"
log "\n${YELLOW}Log file saved to: ${LOG_FILE}${NC}"

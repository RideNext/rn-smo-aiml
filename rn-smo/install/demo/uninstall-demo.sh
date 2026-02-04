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
# Complete Demo Uninstallation Script
# This script removes all components installed by install-demo.sh

DEMO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd "${DEMO_DIR}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log file
LOG_FILE="${DEMO_DIR}/LOGS//uninstall-demo-$(date +%Y%m%d-%H%M%S).log"

# Function to log messages
log() {
    echo -e "$1" | tee -a "${LOG_FILE}"
}

# Function to print section header
print_header() {
    log "\n${BLUE}=========================================================================${NC}"
    log "${BLUE}$1${NC}"
    log "${BLUE}=========================================================================${NC}"
}

# Function to confirm uninstallation
confirm_uninstall() {
    print_header "Uninstallation Confirmation"
    
    log "${YELLOW}This will remove ALL demo components including:${NC}"
    log "  • Energy Saving rApp and Visualization UI"
    log "  • A1 Simulators"
    log "  • rApp Manager"
    log "  • NonRTRIC components (Policy Management, etc.)"
    log "  • RANPM components (Kafka, ICS, PM services)"
    log "  • All data and configurations"
    log ""
    log "${RED}WARNING: This action cannot be undone!${NC}"
    log ""
    
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "${YELLOW}Uninstallation cancelled.${NC}"
        exit 0
    fi
    
    log "${GREEN}Proceeding with uninstallation...${NC}"
}

# Function to delete rApp and UI components
delete_rapp_and_ui() {
    print_header "Removing Energy Saving rApp and Visualization UI"
    
    # Delete deployments
    log "${YELLOW}Deleting rApp and UI deployments...${NC}"
    kubectl delete deployment simple-energy-rapp -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete deployment visualization-backend -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete deployment visualization-frontend -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    # Delete services
    log "${YELLOW}Deleting rApp and UI services...${NC}"
    kubectl delete service simple-energy-rapp -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete service visualization-backend -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete service visualization-frontend -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    log "${GREEN}✓ rApp and UI components removed${NC}"
}

# Function to delete A1 simulators
delete_a1_simulators() {
    print_header "Removing A1 Simulators"
    
    # Delete A1 simulator deployments
    log "${YELLOW}Deleting A1 simulator deployments...${NC}"
    kubectl delete deployment a1-sim-osc-0 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete deployment a1-sim-osc-1 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete deployment a1-sim-std-1-0 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete deployment a1-sim-std-2-0 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    # Delete A1 simulator services
    log "${YELLOW}Deleting A1 simulator services...${NC}"
    kubectl delete service a1-sim-osc-0 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete service a1-sim-osc-1 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete service a1-sim-std-1-0 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete service a1-sim-std-2-0 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    # Delete ConfigMaps
    log "${YELLOW}Deleting A1 simulator ConfigMaps...${NC}"
    kubectl delete configmap a1-sim-osc-0-config -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete configmap a1-sim-osc-1-config -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete configmap a1-sim-std-1-0-config -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete configmap a1-sim-std-2-0-config -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    log "${GREEN}✓ A1 simulators removed${NC}"
}

# Function to uninstall NonRTRIC components
uninstall_ridenext-nonrt() {
    print_header "Removing NonRTRIC Components"
    
    # Uninstall rApp Manager first
    if [ -f "${DEMO_DIR}/scripts/uninstall-rappmanager.sh" ]; then
        log "${YELLOW}Running uninstall-rappmanager.sh...${NC}"
        chmod +x "${DEMO_DIR}/scripts/uninstall-rappmanager.sh"
        "${DEMO_DIR}/scripts/uninstall-rappmanager.sh" 2>&1 | tee -a "${LOG_FILE}"
    fi
    
    #if [ -f "${DEMO_DIR}/scripts/uninstall-onap.sh" ]; then
    #    log "${YELLOW}Running uninstall-onap.sh...${NC}"
    #    chmod +x "${DEMO_DIR}/scripts/uninstall-onap.sh"
    #    "${DEMO_DIR}/scripts/uninstall-onap.sh" 2>&1 | tee -a "${LOG_FILE}"
    #fi

    # Uninstall NonRTRIC Helm chart
    log "${YELLOW}Uninstalling NonRTRIC Helm release...${NC}"
    helm uninstall oran-nonrtric -n ridenext-nonrt 2>&1 | tee -a "${LOG_FILE}"
    
    if [ $? -eq 0 ]; then
        log "${GREEN}✓ NonRTRIC Helm release uninstalled${NC}"
    else
        log "${YELLOW}⚠ NonRTRIC Helm release may not exist or already uninstalled${NC}"
    fi
    
    # Delete any remaining resources
    log "${YELLOW}Cleaning up remaining NonRTRIC resources...${NC}"
    kubectl delete all --all -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete configmap --all -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete secret --all -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete pvc --all -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
}

# Function to uninstall RANPM components
uninstall_ranpm() {
    print_header "Removing RANPM Components"
    
    # Run individual uninstall scripts if they exist
    if [ -f "${DEMO_DIR}/scripts/uninstall-pm-rapp.sh" ]; then
        log "${YELLOW}Running uninstall-pm-rapp.sh...${NC}"
        chmod +x "${DEMO_DIR}/scripts/uninstall-pm-rapp.sh"
        "${DEMO_DIR}/scripts/uninstall-pm-rapp.sh" 2>&1 | tee -a "${LOG_FILE}"
    fi
    
    if [ -f "${DEMO_DIR}/scripts/uninstall-pm-log.sh" ]; then
        log "${YELLOW}Running uninstall-pm-log.sh...${NC}"
        chmod +x "${DEMO_DIR}/scripts/uninstall-pm-log.sh"
        "${DEMO_DIR}/scripts/uninstall-pm-log.sh" 2>&1 | tee -a "${LOG_FILE}"
    fi
    
    if [ -f "${DEMO_DIR}/scripts/uninstall-pm-connect.sh" ]; then
        log "${YELLOW}Running uninstall-pm-connect.sh...${NC}"
        chmod +x "${DEMO_DIR}/scripts/uninstall-pm-connect.sh"
        "${DEMO_DIR}/scripts/uninstall-pm-connect.sh" 2>&1 | tee -a "${LOG_FILE}"
    fi
    
    if [ -f "${DEMO_DIR}/scripts/uninstall-nrt.sh" ]; then
        log "${YELLOW}Running uninstall-nrt.sh...${NC}"
        chmod +x "${DEMO_DIR}/scripts/uninstall-nrt.sh"
        "${DEMO_DIR}/scripts/uninstall-nrt.sh" 2>&1 | tee -a "${LOG_FILE}"
    fi
    
    log "${GREEN}✓ RANPM components removed${NC}"
}

# Function to delete Kafka resources
delete_kafka() {
    print_header "Removing Kafka Resources"
    
    log "${YELLOW}Deleting Kafka cluster...${NC}"
    kubectl delete kafka kafka-1 -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    log "${YELLOW}Deleting Kafka topics...${NC}"
    kubectl delete kafkatopic --all -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    log "${YELLOW}Deleting Kafka users...${NC}"
    kubectl delete kafkauser --all -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    log "${GREEN}✓ Kafka resources removed${NC}"
}

# Function to delete Strimzi operator
delete_strimzi() {
    print_header "Removing Strimzi Operator"
    
    log "${YELLOW}Deleting Strimzi operator...${NC}"
    kubectl delete deployment strimzi-cluster-operator -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete clusterrole strimzi-cluster-operator-namespaced --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete clusterrole strimzi-cluster-operator-global --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete clusterrolebinding strimzi-cluster-operator --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete clusterrolebinding strimzi-cluster-operator-kafka-broker-delegation --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete serviceaccount strimzi-cluster-operator -n ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    # Delete CRDs
    log "${YELLOW}Deleting Strimzi CRDs...${NC}"
    kubectl delete crd kafkas.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkatopics.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkausers.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkaconnects.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkaconnectors.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkamirrormakers.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkabridges.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkamirrormaker2s.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    kubectl delete crd kafkarebalances.kafka.strimzi.io --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    log "${GREEN}✓ Strimzi operator removed${NC}"
}

# Function to delete namespace
delete_namespace() {
    print_header "Removing ridenext-nonrt Namespace"
    
    log "${YELLOW}Deleting ridenext-nonrt namespace...${NC}"
    log "${YELLOW}This may take a few minutes...${NC}"
    
    kubectl delete namespace ridenext-nonrt --ignore-not-found=true 2>&1 | tee -a "${LOG_FILE}"
    
    # Wait for namespace to be deleted
    local max_wait=300
    local elapsed=0
    
    while kubectl get namespace ridenext-nonrt &> /dev/null; do
        if [ $elapsed -ge $max_wait ]; then
            log "${YELLOW}⚠ Namespace deletion is taking longer than expected${NC}"
            log "${YELLOW}You may need to manually check and remove finalizers${NC}"
            break
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo -n "."
    done
    
    if ! kubectl get namespace ridenext-nonrt &> /dev/null; then
        log "\n${GREEN}✓ ridenext-nonrt namespace deleted${NC}"
    else
        log "\n${YELLOW}⚠ ridenext-nonrt namespace still exists${NC}"
        log "${YELLOW}Check for resources with finalizers: kubectl get all -n ridenext-nonrt${NC}"
    fi
}

# Function to clean up local files
cleanup_local_files() {
    print_header "Cleaning Up Local Files"
    
    log "${YELLOW}Removing completion markers...${NC}"
    rm -f "${DEMO_DIR}/.scripts/"*.completed 2>&1 | tee -a "${LOG_FILE}"
    
    log "${YELLOW}Removing temporary files...${NC}"
    rm -f "${DEMO_DIR}/scripts/"*.json 2>&1 | tee -a "${LOG_FILE}"
    rm -f "${DEMO_DIR}/scripts/".tmp.* 2>&1 | tee -a "${LOG_FILE}"
    
    log "${GREEN}✓ Local files cleaned up${NC}"
}

# Function to verify uninstallation
verify_uninstallation() {
    print_header "Verifying Uninstallation"
    
    if kubectl get namespace ridenext-nonrt &> /dev/null; then
        log "${YELLOW}⚠ ridenext-nonrt namespace still exists${NC}"
        log "${YELLOW}Remaining resources:${NC}"
        kubectl get all -n ridenext-nonrt 2>&1 | tee -a "${LOG_FILE}"
    else
        log "${GREEN}✓ ridenext-nonrt namespace successfully removed${NC}"
    fi
    
    # Check for remaining Helm releases
    log "\n${YELLOW}Checking for remaining Helm releases...${NC}"
    if helm list -n ridenext-nonrt 2>&1 | grep -q "oran-ridenext-nonrt"; then
        log "${YELLOW}⚠ Helm release still exists${NC}"
    else
        log "${GREEN}✓ No Helm releases found${NC}"
    fi
}

# Function to print summary
print_summary() {
    print_header "Uninstallation Complete"
    
    log "${GREEN}Demo components have been removed!${NC}\n"
    
    log "${YELLOW}Removed Components:${NC}"
    log "  ${GREEN}✓${NC} Energy Saving rApp & Visualization UI"
    log "  ${GREEN}✓${NC} A1 Simulators"
    log "  ${GREEN}✓${NC} rApp Manager"
    log "  ${GREEN}✓${NC} NonRTRIC components"
    log "  ${GREEN}✓${NC} RANPM components"
    log "  ${GREEN}✓${NC} Kafka cluster"
    log "  ${GREEN}✓${NC} Strimzi operator"
    log "  ${GREEN}✓${NC} ridenext-nonrt namespace\n"
    
    log "${YELLOW}What's Next:${NC}"
    log "  • To reinstall the demo: ${GREEN}cd ${DEMO_DIR} && ./install-demo.sh${NC}"
    log "  • To check for any remaining resources: ${GREEN}kubectl get all -n ridenext-nonrt${NC}"
    log "  • Uninstallation log: ${GREEN}${LOG_FILE}${NC}\n"
}

# Main uninstallation flow
main() {
    log "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║                                                                    ║${NC}"
    log "${BLUE}║        Energy Saving rApp Demo - Complete Uninstallation          ║${NC}"
    log "${BLUE}║                                                                    ║${NC}"
    log "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    log ""
    log "${YELLOW}Log file: ${LOG_FILE}${NC}\n"
    
    # Confirm uninstallation
    confirm_uninstall
    
    # Remove components in reverse order
    delete_rapp_and_ui
    delete_a1_simulators
    uninstall_ridenext-nonrt
    delete_kafka
    uninstall_ranpm
    delete_strimzi
    delete_namespace
    
    # Clean up local files
    cleanup_local_files
    
    # Verify uninstallation
    verify_uninstallation
    
    # Print summary
    print_summary
    
    log "${GREEN}Uninstallation completed!${NC}"
    log "${YELLOW}Log saved to: ${LOG_FILE}${NC}"
}

# Run main function
main

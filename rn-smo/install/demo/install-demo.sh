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
# Complete Demo Installation Script
# This script installs all components required for the Energy Saving rApp Demo

DEMO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
cd "${DEMO_DIR}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
LOG_DIR="${DEMO_DIR}/LOGS/install-demo-Logs/"

if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
fi

# Log file
LOG_FILE="$LOG_DIR/install-demo-$(date +%Y%m%d-%H%M%S).log"

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

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    for cmd in kubectl helm docker jq envsubst; do
        if ! command -v $cmd &> /dev/null; then
            missing_tools+=("$cmd")
            log "${RED}✗ Missing: $cmd${NC}"
        else
            log "${GREEN}✓ Found: $cmd${NC}"
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log "${RED}Error: Missing required tools: ${missing_tools[*]}${NC}"
        log "${YELLOW}Please install the missing tools and try again.${NC}"
        exit 1
    fi
    
    # Check if kubectl can connect to cluster
    if ! kubectl cluster-info &> /dev/null; then
        log "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
        log "${YELLOW}Please ensure kubectl is configured correctly${NC}"
        exit 1
    fi
    log "${GREEN}✓ Kubernetes cluster accessible${NC}"
}

# Function to install NFS provisioner
install_nfs_provisioner() {
    print_header "Installing NFS Provisioner"
    
    if kubectl get storageclass nfs-client &> /dev/null; then
        log "${GREEN}✓ NFS provisioner already installed${NC}"
        return 0
    fi
    
    log "${YELLOW}Installing NFS provisioner...${NC}"
    
    helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
    helm repo update
    
    helm install nfs-subdir-external-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
        --set nfs.server=127.0.0.1 \
        --set nfs.path=/dockerdata-nfs \
        --set storageClass.name=nfs-client \
        --set storageClass.defaultClass=true
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: NFS provisioner installation failed${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ NFS provisioner installed successfully${NC}"
}

# Function to install istio if not present
install_istio() {
    print_header "Checking and Installing Istio"
    
    # Check if istio is already installed
    if kubectl get authorizationpolicies -A &> /dev/null; then
        log "${GREEN}✓ Istio is already installed${NC}"
        return 0
    fi
    
    log "${YELLOW}Istio not found. Installing Istio...${NC}"
    
    # Check if istioctl is available
    if ! command -v istioctl &> /dev/null; then
        log "${YELLOW}istioctl not found. Downloading...${NC}"
        curl -L https://istio.io/downloadIstio | sh -
        export PATH=$PWD/istio-*/bin:$PATH
    fi
    
    # Install istio with demo profile
    log "${YELLOW}Installing Istio with demo profile...${NC}"
    istioctl install --set profile=demo -y
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: Istio installation failed${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ Istio installed successfully${NC}"
}

# Function to install RANPM components (Layer 0)
install_ranpm() {
    print_header "Layer 0: Installing RANPM Components"
    
    if [ ! -f "${DEMO_DIR}/scripts/install-ranpm-improved.sh" ]; then
        log "${RED}Error: install-ranpm-improved.sh not found${NC}"
        exit 1
    fi
    
    chmod +x "${DEMO_DIR}/scripts/install-ranpm-improved.sh"
    "${DEMO_DIR}/scripts/install-ranpm-improved.sh"
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: RANPM installation failed${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ RANPM components installed successfully${NC}"
}

# Function to install NonRTRIC components (Layer 1)
install_ridenext-nonrt() {
    print_header "Layer 1: Installing NonRTRIC Components"
    
    if [ ! -f "${DEMO_DIR}/scripts/install-nonrtric-only.sh" ]; then
        log "${RED}Error: install-nonrtric-only.sh not found${NC}"
        exit 1
    fi
    
    chmod +x "${DEMO_DIR}/scripts/install-nonrtric-only.sh"
    "${DEMO_DIR}/scripts/install-nonrtric-only.sh"
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: NonRTRIC installation failed${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ NonRTRIC components installed successfully${NC}"
}

# Function to install rappmanager 
install_rappmanager() {
    print_header "Installing rappmanager ..."
    
    if [ ! -f "${DEMO_DIR}/scripts/install-rappmanager.sh" ]; then
        log "${RED}Error: install-rappmanager.sh not found${NC}"
        exit 1
    fi
    
    chmod +x "${DEMO_DIR}/scripts/install-rappmanager.sh"
    "${DEMO_DIR}/scripts/install-rappmanager.sh"
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: rappmanager installation failed${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ rappmanager installed successfully${NC}"
}

# Function to deploy A1 simulators
deploy_a1_simulators() {
    print_header "Layer 2: Deploying A1 Simulators"
    
    if [ ! -f "${DEMO_DIR}/scripts/deploy-a1-components.sh" ]; then
        log "${RED}Error: deploy-a1-components.sh not found${NC}"
        exit 1
    fi
    
    chmod +x "${DEMO_DIR}/scripts/deploy-a1-components.sh"
    "${DEMO_DIR}/scripts/deploy-a1-components.sh"
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: A1 simulator deployment failed${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ A1 simulators deployed successfully${NC}"
}

# Function to deploy Energy Saving rApp and UI
deploy_rapp_and_ui() {
    print_header "Layer 3: Deploying Energy Saving rApp and Visualization UI"
    
    if [ ! -f "${DEMO_DIR}/scripts/deploy-rapp-demo.sh" ]; then
        log "${RED}Error: deploy-rapp-demo.sh not found${NC}"
        exit 1
    fi
    
    chmod +x "${DEMO_DIR}/scripts/deploy-rapp-demo.sh"
    "${DEMO_DIR}/scripts/deploy-rapp-demo.sh"
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: rApp and UI deployment failed${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ Energy Saving rApp and UI deployed successfully${NC}"
}

# Function to deploy PM data producer
deploy_pm_producer() {
    print_header "Layer 4: Deploying PM Data Producer"
    
    log "${YELLOW}Building PM data producer image...${NC}"
    
    cd "${DEMO_DIR}/es-rapp"
    docker build -t localhost:5000/pm-data-producer:latest -f Dockerfile.producer .
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: Failed to build producer image${NC}"
        exit 1
    fi
    
    docker push localhost:5000/pm-data-producer:latest
    
    if [ $? -ne 0 ]; then
        log "${YELLOW}⚠ Failed to push to registry, will use local image${NC}"
    fi
    
    cd "${DEMO_DIR}"
    
    log "${YELLOW}Deploying PM data producer job...${NC}"
    kubectl apply -f es-rapp/producer-job.yaml
    
    if [ $? -ne 0 ]; then
        log "${RED}Error: Failed to deploy producer job${NC}"
        exit 1
    fi
    
    log "${GREEN}✓ PM data producer deployed successfully${NC}"
}

# Function to verify installation
verify_installation() {
    print_header "Verifying Installation"
    
    log "${YELLOW}Checking pod status in ridenext-nonrt namespace...${NC}"
    kubectl get pods -n ridenext-nonrt | tee -a "${LOG_FILE}"
    
    log "\n${YELLOW}Checking services in ridenext-nonrt namespace...${NC}"
    kubectl get svc -n ridenext-nonrt | tee -a "${LOG_FILE}"
    
    # Check critical components
    local critical_pods=(
        "kafka-1-kafka-0"
        "policymanagementservice"
        "a1-sim-osc-0"
        "a1-sim-osc-1"
        "a1-sim-std-1-0"
        "a1-sim-std-2-0"
        "simple-energy-rapp"
        "visualization-backend"
        "visualization-frontend"
    )
    
    log "\n${YELLOW}Checking critical components...${NC}"
    local all_ready=true
    
    for pod_prefix in "${critical_pods[@]}"; do
        if kubectl get pods -n ridenext-nonrt | grep -q "^${pod_prefix}.*Running"; then
            log "${GREEN}✓ ${pod_prefix} is running${NC}"
        else
            log "${RED}✗ ${pod_prefix} is not running${NC}"
            all_ready=false
        fi
    done
    
    if [ "$all_ready" = true ]; then
        log "\n${GREEN}✓ All critical components are running${NC}"
    else
        log "\n${YELLOW}⚠ Some components are not ready yet. They may still be starting up.${NC}"
        log "${YELLOW}Run 'kubectl get pods -n ridenext-nonrt' to check status${NC}"
    fi
}

# Function to print next steps
print_next_steps() {
    print_header "Installation Complete!"
    
    log "${GREEN}All demo components have been installed successfully!${NC}\n"
    
    log "${YELLOW}Installed Components:${NC}"
    log "  ${GREEN}✓${NC} Layer 0: RANPM (Kafka, ICS, PM services)"
    log "  ${GREEN}✓${NC} Layer 1: NonRTRIC (Policy Management, A1 Controller)"
    log "  ${GREEN}✓${NC} Layer 2: A1 Simulators (4 simulators)"
    log "  ${GREEN}✓${NC} Layer 3: Energy Saving rApp & Visualization UI"
    log "  ${GREEN}✓${NC} Layer 4: PM Data Producer (generates test data)\n"
    
    log "${YELLOW}Next Steps to Run the Demo:${NC}\n"
    
    log "${BLUE}Option 1: Using Port Forwarding (Recommended for testing)${NC}"
    log "1. Open 4 terminals and run the following commands:"
    log "   ${GREEN}Terminal 1:${NC} kubectl port-forward svc/visualization-backend 8000:8000 -n ridenext-nonrt"
    log "   ${GREEN}Terminal 2:${NC} kubectl port-forward svc/visualization-frontend 5173:80 -n ridenext-nonrt"
    log "   ${GREEN}Terminal 3:${NC} kubectl port-forward svc/policymanagementservice 31850:8081 -n ridenext-nonrt"
    log "   ${GREEN}Terminal 4:${NC} cd ${DEMO_DIR}/scripts && ./create-energy-policies.sh"
    log ""
    log "2. Access the UI at: ${GREEN}http://localhost:5173${NC}\n"
    
    log "${BLUE}Option 2: Using NodePort (For persistent access)${NC}"
    log "1. Get the NodePort for the frontend:"
    log "   ${GREEN}kubectl get svc visualization-frontend -n ridenext-nonrt${NC}"
    log "2. Access the UI at: ${GREEN}http://<node-ip>:<nodeport>${NC}"
    log "3. Run the policy creation script:"
    log "   ${GREEN}cd ${DEMO_DIR}/scripts && ./create-energy-policies.sh${NC}\n"
    
    log "${YELLOW}Useful Commands:${NC}"
    log "  • Check pod status:    ${GREEN}kubectl get pods -n ridenext-nonrt${NC}"
    log "  • View pod logs:       ${GREEN}kubectl logs <pod-name> -n ridenext-nonrt${NC}"
    log "  • Check services:      ${GREEN}kubectl get svc -n ridenext-nonrt${NC}"
    log "  • Access demo helper:  ${GREEN}cd ${DEMO_DIR}/scripts && ./access-demo.sh${NC}"
    log "  • Check policies:      ${GREEN}cd ${DEMO_DIR}/scripts && ./show-policies-report.sh${NC}\n"
    
    log "${YELLOW}Troubleshooting:${NC}"
    log "  • If pods are not ready, wait a few minutes and check again"
    log "  • View installation log: ${GREEN}${LOG_FILE}${NC}"
    log "  • For detailed status:   ${GREEN}kubectl describe pod <pod-name> -n ridenext-nonrt${NC}\n"
    
    log "${BLUE}To uninstall the demo:${NC}"
    log "  ${GREEN}cd ${DEMO_DIR} && ./uninstall-demo.sh${NC}\n"
}

# Main installation flow
main() {
    log "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    log "${BLUE}║                                                                    ║${NC}"
    log "${BLUE}║        Energy Saving rApp Demo - Complete Installation            ║${NC}"
    log "${BLUE}║                                                                    ║${NC}"
    log "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    log ""
    log "${YELLOW}Log file: ${LOG_FILE}${NC}\n"
    
    # Check prerequisites
    check_prerequisites
    
    # Install istio if not present
    install_istio
    
    # Install NFS provisioner
    install_nfs_provisioner
    
    # Install components in layers
    install_ranpm
    install_rappmanager
    install_ridenext-nonrt
    deploy_a1_simulators
    deploy_rapp_and_ui
    deploy_pm_producer
    
    # Verify installation
    verify_installation
    
    # Print next steps
    print_next_steps
    
    log "${GREEN}Installation completed successfully!${NC}"
    log "${YELLOW}Log saved to: ${LOG_FILE}${NC}"
}

# Run main function
main

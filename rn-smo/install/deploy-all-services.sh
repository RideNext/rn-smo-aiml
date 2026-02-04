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

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${PROJECT_ROOT}/install"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   5G RAN PM Complete Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Project Root: ${PROJECT_ROOT}"
echo "Install Directory: ${INSTALL_DIR}"
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Function to check if command exists
check_command() {
    local cmd=$1
    if command -v "$cmd" >/dev/null 2>&1; then
        print_status "SUCCESS" "$cmd is installed"
        return 0
    else
        print_status "ERROR" "$cmd is not installed"
        return 1
    fi
}

# Function to check Kubernetes connection
check_kubernetes() {
    print_status "INFO" "Checking Kubernetes connection..."
    if kubectl cluster-info >/dev/null 2>&1; then
        local k8s_version=$(kubectl version --client --short 2>/dev/null | head -n1)
        print_status "SUCCESS" "Kubernetes is accessible - $k8s_version"
        
        # Check if istio is installed
        if kubectl get authorizationpolicies -A >/dev/null 2>&1; then
            print_status "SUCCESS" "Istio is installed"
        else
            print_status "ERROR" "Istio is not installed. Please install Istio first."
            return 1
        fi
        return 0
    else
        print_status "ERROR" "Cannot connect to Kubernetes cluster"
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    local failed=0
    
    # Check required commands
    local commands=("kubectl" "helm" "docker" "jq" "envsubst" "keytool" "openssl")
    for cmd in "${commands[@]}"; do
        if ! check_command "$cmd"; then
            failed=1
        fi
    done
    
    # Check Kubernetes
    if ! check_kubernetes; then
        failed=1
    fi
    
    if [ $failed -eq 1 ]; then
        print_status "ERROR" "Prerequisites check failed. Please install missing components."
        exit 1
    fi
    
    print_status "SUCCESS" "All prerequisites satisfied"
}

# Function to build required images
build_images() {
    print_status "INFO" "Building required images..."
    
    # Build HTTPS server
    print_status "INFO" "Building HTTPS server image..."
    cd "${PROJECT_ROOT}/https-server"
    if [ -f "build.sh" ]; then
        chmod +x build.sh
        if ./build.sh no-push; then
            print_status "SUCCESS" "HTTPS server image built successfully"
        else
            print_status "ERROR" "Failed to build HTTPS server image"
            return 1
        fi
    else
        print_status "ERROR" "HTTPS server build script not found"
        return 1
    fi
    
    # Build PM rApp
    print_status "INFO" "Building PM rApp image..."
    cd "${PROJECT_ROOT}/pm-rapp"
    if [ -f "build.sh" ]; then
        chmod +x build.sh
        if ./build.sh no-push; then
            print_status "SUCCESS" "PM rApp image built successfully"
        else
            print_status "ERROR" "Failed to build PM rApp image"
            return 1
        fi
    else
        print_status "ERROR" "PM rApp build script not found"
        return 1
    fi
    
    cd "${PROJECT_ROOT}"
    print_status "SUCCESS" "All required images built successfully"
}

# Function to deploy core services
deploy_core_services() {
    print_status "INFO" "Deploying core RANPM services..."
    
    cd "${INSTALL_DIR}"
    if [ -f "install-nrt.sh" ]; then
        chmod +x install-nrt.sh
        print_status "INFO" "Running install-nrt.sh..."
        if ./install-nrt.sh; then
            print_status "SUCCESS" "Core RANPM services deployed successfully"
        else
            print_status "ERROR" "Failed to deploy core RANPM services"
            return 1
        fi
    else
        print_status "ERROR" "install-nrt.sh not found"
        return 1
    fi
}

# Function to deploy PM logger
deploy_pm_logger() {
    print_status "INFO" "Deploying PM Logger services..."
    
    cd "${INSTALL_DIR}"
    if [ -f "install-pm-log.sh" ]; then
        chmod +x install-pm-log.sh
        print_status "INFO" "Running install-pm-log.sh..."
        if ./install-pm-log.sh; then
            print_status "SUCCESS" "PM Logger services deployed successfully"
        else
            print_status "WARNING" "PM Logger deployment had issues (this is optional)"
        fi
    else
        print_status "WARNING" "install-pm-log.sh not found (optional component)"
    fi
}

# Function to deploy PM influx job
deploy_pm_influx_job() {
    print_status "INFO" "Deploying PM InfluxDB Job..."
    
    cd "${INSTALL_DIR}"
    if [ -f "install-pm-influx-job.sh" ]; then
        chmod +x install-pm-influx-job.sh
        print_status "INFO" "Running install-pm-influx-job.sh..."
        if ./install-pm-influx-job.sh; then
            print_status "SUCCESS" "PM InfluxDB Job deployed successfully"
        else
            print_status "WARNING" "PM InfluxDB Job deployment had issues (this is optional)"
        fi
    else
        print_status "WARNING" "install-pm-influx-job.sh not found (optional component)"
    fi
}

# Function to deploy PM rApp
deploy_pm_rapp() {
    print_status "INFO" "Deploying PM rApp..."
    
    cd "${INSTALL_DIR}"
    if [ -f "install-pm-rapp.sh" ]; then
        chmod +x install-pm-rapp.sh
        print_status "INFO" "Running install-pm-rapp.sh..."
        if ./install-pm-rapp.sh; then
            print_status "SUCCESS" "PM rApp deployed successfully"
        else
            print_status "WARNING" "PM rApp deployment had issues (this is optional)"
        fi
    else
        print_status "WARNING" "install-pm-rapp.sh not found (optional component)"
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "INFO" "Verifying deployment..."
    
    # Wait for all pods to be ready
    print_status "INFO" "Waiting for all pods to be ready..."
    local max_wait=300 # 5 minutes
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        local not_ready=$(kubectl get pods -n ridenext-nonrt --no-headers | grep -v Running | grep -v Completed | wc -l)
        if [ $not_ready -eq 0 ]; then
            print_status "SUCCESS" "All pods in ridenext-nonrt namespace are ready"
            break
        else
            print_status "INFO" "Waiting for $not_ready pods to be ready... (${wait_time}s/${max_wait}s)"
            sleep 10
            wait_time=$((wait_time + 10))
        fi
    done
    
    if [ $wait_time -ge $max_wait ]; then
        print_status "WARNING" "Some pods may still be starting. Check manually with 'kubectl get pods -n ridenext-nonrt'"
    fi
    
    # Show all pods status
    print_status "INFO" "Current pod status:"
    kubectl get pods -n ridenext-nonrt
    
    # Check ran-o1-sim namespace
    if kubectl get namespace ran-o1-sim >/dev/null 2>&1; then
        print_status "INFO" "RAN O1 Simulator pods:"
        kubectl get pods -n ran-o1-sim
    fi
}

# Function to show access information
show_access_info() {
    print_status "INFO" "Getting cluster access information..."
    
    # Get the cluster IP
    local cluster_ip=$(kubectl cluster-info | grep 'Kubernetes control plane' | sed 's/.*https:\/\/\([^:]*\).*/\1/')
    if [ -z "$cluster_ip" ]; then
        cluster_ip="<your-cluster-ip>"
    fi
    
    echo ""
    print_status "SUCCESS" "Deployment completed! Access information:"
    echo ""
    echo -e "${GREEN}=== Administrative Interfaces ===${NC}"
    echo "Keycloak Admin Console:    http://${cluster_ip}:31788 (admin/admin)"
    echo "Redpanda Console:          http://${cluster_ip}:31767"
    echo "Minio Web:                 http://${cluster_ip}:31768 (admin/adminadmin)"
    echo "InfluxDB:                  http://${cluster_ip}:31812 (admin/mySuP3rS3cr3tT0keN)"
    echo "Control Panel:             http://${cluster_ip}:30091/ei-coordinator"
    echo ""
    echo -e "${GREEN}=== API Endpoints ===${NC}"
    echo "Keycloak API (via proxy):  http://${cluster_ip}:31784"
    echo "OPA Rules Bundle Server:   http://${cluster_ip}:32201"
    echo "Information Coordinator:   http://${cluster_ip}:31823 (HTTP), https://${cluster_ip}:31824 (HTTPS)"
    echo "VES Collector:             http://${cluster_ip}:31760 (HTTP), https://${cluster_ip}:31761 (HTTPS)"
    echo ""
    echo -e "${BLUE}=== Quick Commands ===${NC}"
    echo "Check all pods:            kubectl get pods -n ridenext-nonrt"
    echo "Check services:            kubectl get svc -n ridenext-nonrt"
    echo "View logs:                 kubectl logs <pod-name> -n ridenext-nonrt"
    echo ""
}

# Function to create monitoring script
create_monitoring_script() {
    print_status "INFO" "Creating monitoring script..."
    
    cat > "${PROJECT_ROOT}/dummy/monitor-services.sh" << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   5G RAN PM Services Monitor${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to check pod status
check_pods() {
    echo -e "\n${YELLOW}=== Pod Status ===${NC}"
    kubectl get pods -n ridenext-nonrt -o wide
    
    echo -e "\n${YELLOW}=== RAN O1 Simulator Pods ===${NC}"
    kubectl get pods -n ran-o1-sim -o wide 2>/dev/null || echo "RAN O1 Simulator namespace not found"
}

# Function to check services
check_services() {
    echo -e "\n${YELLOW}=== Services ===${NC}"
    kubectl get svc -n ridenext-nonrt
}

# Function to check persistent volumes
check_storage() {
    echo -e "\n${YELLOW}=== Persistent Volumes ===${NC}"
    kubectl get pv
    echo -e "\n${YELLOW}=== Persistent Volume Claims ===${NC}"
    kubectl get pvc -n ridenext-nonrt
}

# Function to show resource usage
show_resources() {
    echo -e "\n${YELLOW}=== Resource Usage ===${NC}"
    kubectl top nodes 2>/dev/null || echo "Metrics server not available"
    kubectl top pods -n ridenext-nonrt 2>/dev/null || echo "Pod metrics not available"
}

# Function to check service health
check_health() {
    echo -e "\n${YELLOW}=== Service Health Check ===${NC}"
    
    local cluster_ip=$(kubectl cluster-info | grep 'Kubernetes control plane' | sed 's/.*https:\/\/\([^:]*\).*/\1/')
    
    # Check key services
    echo "Checking Keycloak..."
    curl -s -o /dev/null -w "Keycloak: %{http_code}\n" "http://${cluster_ip}:31784" || echo "Keycloak: Connection failed"
    
    echo "Checking Control Panel..."
    curl -s -o /dev/null -w "Control Panel: %{http_code}\n" "http://${cluster_ip}:30091" || echo "Control Panel: Connection failed"
    
    echo "Checking Minio..."
    curl -s -o /dev/null -w "Minio: %{http_code}\n" "http://${cluster_ip}:31768" || echo "Minio: Connection failed"
}

# Main execution
case "${1:-status}" in
    "pods")
        check_pods
        ;;
    "services")
        check_services
        ;;
    "storage")
        check_storage
        ;;
    "resources")
        show_resources
        ;;
    "health")
        check_health
        ;;
    "all")
        check_pods
        check_services
        check_storage
        show_resources
        check_health
        ;;
    *)
        check_pods
        check_services
        ;;
esac

echo -e "\n${GREEN}Available commands:${NC}"
echo "  ./monitor-services.sh pods      - Show pod status"
echo "  ./monitor-services.sh services  - Show services"
echo "  ./monitor-services.sh storage   - Show storage status"
echo "  ./monitor-services.sh resources - Show resource usage"
echo "  ./monitor-services.sh health    - Check service health"
echo "  ./monitor-services.sh all       - Show everything"
EOF

    chmod +x "${PROJECT_ROOT}/dummy/monitor-services.sh"
    print_status "SUCCESS" "Monitoring script created at dummy/monitor-services.sh"
}

# Function to create cleanup script
create_cleanup_script() {
    print_status "INFO" "Creating cleanup script..."
    
    cat > "${PROJECT_ROOT}/dummy/cleanup-all-services.sh" << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${PROJECT_ROOT}/install"

echo -e "${RED}========================================${NC}"
echo -e "${RED}   5G RAN PM Cleanup Script${NC}"
echo -e "${RED}========================================${NC}"

echo -e "${YELLOW}WARNING: This will remove all RANPM services and data!${NC}"
echo -e "${YELLOW}Are you sure you want to continue? (y/N)${NC}"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo -e "${RED}Starting cleanup...${NC}"

cd "${INSTALL_DIR}"

# Run uninstall scripts in reverse order
echo "Uninstalling PM rApp..."
if [ -f "uninstall-pm-rapp.sh" ]; then
    chmod +x uninstall-pm-rapp.sh
    ./uninstall-pm-rapp.sh
fi

echo "Uninstalling PM Logger..."
if [ -f "uninstall-pm-log.sh" ]; then
    chmod +x uninstall-pm-log.sh
    ./uninstall-pm-log.sh
fi

echo "Uninstalling core services..."
if [ -f "uninstall-nrt.sh" ]; then
    chmod +x uninstall-nrt.sh
    ./uninstall-nrt.sh
fi

# Additional cleanup
echo "Cleaning up any remaining resources..."
kubectl delete namespace ridenext-nonrt --ignore-not-found=true
kubectl delete namespace ran-o1-sim --ignore-not-found=true

# Clean up built images (optional)
echo -e "${YELLOW}Do you want to remove built Docker images? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Removing Docker images..."
    docker rmi pm-https-server:latest 2>/dev/null || true
    docker rmi pm-rapp:latest 2>/dev/null || true
fi

echo -e "${GREEN}Cleanup completed!${NC}"
EOF

    chmod +x "${PROJECT_ROOT}/dummy/cleanup-all-services.sh"
    print_status "SUCCESS" "Cleanup script created at dummy/cleanup-all-services.sh"
}

# Function to create troubleshooting script
create_troubleshooting_script() {
    print_status "INFO" "Creating troubleshooting script..."
    
    cat > "${PROJECT_ROOT}/dummy/troubleshoot.sh" << 'EOF'
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   5G RAN PM Troubleshooting Guide${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to check failed pods
check_failed_pods() {
    echo -e "\n${YELLOW}=== Failed/Pending Pods ===${NC}"
    kubectl get pods -n ridenext-nonrt | grep -E "(Error|CrashLoopBackOff|Pending|Init|ContainerCreating)" || echo "No failed pods found"
    
    echo -e "\n${YELLOW}=== Recent Pod Events ===${NC}"
    kubectl get events -n ridenext-nonrt --sort-by='.lastTimestamp' | tail -20
}

# Function to show logs for problematic pods
show_problem_logs() {
    echo -e "\n${YELLOW}=== Logs for Problematic Pods ===${NC}"
    
    # Get pods that are not running
    local problem_pods=$(kubectl get pods -n ridenext-nonrt --no-headers | grep -v Running | grep -v Completed | awk '{print $1}')
    
    if [ -z "$problem_pods" ]; then
        echo "No problematic pods found"
        return
    fi
    
    for pod in $problem_pods; do
        echo -e "\n${RED}--- Logs for $pod ---${NC}"
        kubectl logs "$pod" -n ridenext-nonrt --tail=50 || echo "Could not get logs for $pod"
    done
}

# Function to check resource constraints
check_resources() {
    echo -e "\n${YELLOW}=== Resource Check ===${NC}"
    
    echo "Node Resources:"
    kubectl describe nodes | grep -E "(Name:|Allocatable|Allocated resources)" | head -20
    
    echo -e "\nPod Resource Requests/Limits:"
    kubectl get pods -n ridenext-nonrt -o custom-columns="NAME:.metadata.name,CPU_REQ:.spec.containers[*].resources.requests.cpu,MEM_REQ:.spec.containers[*].resources.requests.memory,CPU_LIM:.spec.containers[*].resources.limits.cpu,MEM_LIM:.spec.containers[*].resources.limits.memory"
}

# Function to check persistent volume issues
check_storage_issues() {
    echo -e "\n${YELLOW}=== Storage Issues ===${NC}"
    
    echo "PVC Status:"
    kubectl get pvc -n ridenext-nonrt
    
    echo -e "\nPV Status:"
    kubectl get pv
    
    echo -e "\nStorage Events:"
    kubectl get events -n ridenext-nonrt | grep -i "volume\|storage\|mount" | tail -10
}

# Function to check networking issues
check_network_issues() {
    echo -e "\n${YELLOW}=== Network Issues ===${NC}"
    
    echo "Service Status:"
    kubectl get svc -n ridenext-nonrt
    
    echo -e "\nEndpoints:"
    kubectl get endpoints -n ridenext-nonrt | head -10
    
    echo -e "\nIngress/Routes:"
    kubectl get ingress -n ridenext-nonrt 2>/dev/null || echo "No ingress found"
}

# Function to check Helm releases
check_helm_releases() {
    echo -e "\n${YELLOW}=== Helm Releases ===${NC}"
    helm list -n ridenext-nonrt
    helm list -n ran-o1-sim 2>/dev/null || echo "No releases in ran-o1-sim namespace"
}

# Common troubleshooting steps
show_common_fixes() {
    echo -e "\n${GREEN}=== Common Troubleshooting Steps ===${NC}"
    echo "1. Check if all prerequisites are installed (kubectl, helm, istio)"
    echo "2. Verify Kubernetes cluster has sufficient resources"
    echo "3. Check if required images are built:"
    echo "   - pm-https-server:latest"
    echo "   - pm-rapp:latest"
    echo "4. Restart failed pods:"
    echo "   kubectl delete pod <pod-name> -n ridenext-nonrt"
    echo "5. Check Helm release status:"
    echo "   helm status <release-name> -n ridenext-nonrt"
    echo "6. Re-run specific installation script if needed"
    echo "7. Check node port accessibility from your machine"
    echo "8. Verify Istio is properly installed and running"
}

# Main execution
case "${1:-all}" in
    "pods")
        check_failed_pods
        ;;
    "logs")
        show_problem_logs
        ;;
    "resources")
        check_resources
        ;;
    "storage")
        check_storage_issues
        ;;
    "network")
        check_network_issues
        ;;
    "helm")
        check_helm_releases
        ;;
    "fixes")
        show_common_fixes
        ;;
    *)
        check_failed_pods
        show_problem_logs
        check_resources
        check_helm_releases
        show_common_fixes
        ;;
esac

echo -e "\n${GREEN}Available troubleshooting commands:${NC}"
echo "  ./troubleshoot.sh pods      - Check failed/pending pods"
echo "  ./troubleshoot.sh logs      - Show logs for problematic pods"
echo "  ./troubleshoot.sh resources - Check resource constraints"
echo "  ./troubleshoot.sh storage   - Check storage issues"
echo "  ./troubleshoot.sh network   - Check networking issues"
echo "  ./troubleshoot.sh helm      - Check Helm releases"
echo "  ./troubleshoot.sh fixes     - Show common fixes"
EOF

    chmod +x "${PROJECT_ROOT}/dummy/troubleshoot.sh"
    print_status "SUCCESS" "Troubleshooting script created at dummy/troubleshoot.sh"
}

# Main execution function
main() {
    echo "Starting deployment at $(date)"
    
    # Step 1: Check prerequisites
    check_prerequisites
    
    # Step 2: Build required images
    print_status "INFO" "Step 1: Building required images..."
    build_images
    
    # Step 3: Deploy core services
    print_status "INFO" "Step 2: Deploying core services..."
    deploy_core_services
    
    # Step 4: Deploy additional services
    print_status "INFO" "Step 3: Deploying additional services..."
    deploy_pm_logger
    deploy_pm_influx_job
    deploy_pm_rapp
    
    # Step 5: Verify deployment
    print_status "INFO" "Step 4: Verifying deployment..."
    verify_deployment
    
    # Step 6: Create monitoring and management scripts
    print_status "INFO" "Step 5: Creating management scripts..."
    create_monitoring_script
    create_cleanup_script
    create_troubleshooting_script
    
    # Step 7: Show access information
    show_access_info
    
    echo ""
    print_status "SUCCESS" "Complete deployment finished at $(date)"
    echo ""
    print_status "INFO" "Additional scripts created in dummy/ folder:"
    echo "  - monitor-services.sh     : Monitor service status"
    echo "  - cleanup-all-services.sh : Clean up all services"
    echo "  - troubleshoot.sh         : Troubleshooting guide"
}

# Execute main function
main "$@"

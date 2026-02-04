#!/bin/bash

#  ============LICENSE_START===============================================
#  Copyright (C) 2025 Nordix Foundation. All rights reserved.
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

set -e

echo "======================="
echo "Installing Grafana for PM Data Visualization"
echo "======================="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "kubectl could not be found. Please install kubectl first."
    exit 1
fi

# Check if helm is available
if ! command -v helm &> /dev/null; then
    echo "helm could not be found. Please install helm first."
    exit 1
fi

# Function to get InfluxDB token
get_influxdb_token() {
    echo "Retrieving InfluxDB token..."
    INFLUXDB_TOKEN=$(kubectl exec -n ridenext-nonrt influxdb2-0 -- influx auth list --org est --json | jq -r '.[0].token' 2>/dev/null || echo "")
    
    if [ -z "$INFLUXDB_TOKEN" ]; then
        echo "Warning: Could not retrieve InfluxDB token. Using default configuration."
        INFLUXDB_TOKEN="default-token"
    fi
    
    echo "InfluxDB token retrieved."
}

# Function to check if InfluxDB is running
check_influxdb() {
    echo "Checking if InfluxDB is running..."
    if ! kubectl get pod -n ridenext-nonrt influxdb2-0 &> /dev/null; then
        echo "Error: InfluxDB pod 'influxdb2-0' not found in ridenext-nonrt namespace."
        echo "Please ensure InfluxDB is installed and running."
        exit 1
    fi
    
    INFLUXDB_STATUS=$(kubectl get pod -n ridenext-nonrt influxdb2-0 -o jsonpath='{.status.phase}')
    if [ "$INFLUXDB_STATUS" != "Running" ]; then
        echo "Error: InfluxDB is not running. Current status: $INFLUXDB_STATUS"
        exit 1
    fi
    
    echo "InfluxDB is running."
}

# Function to install Grafana
install_grafana() {
    echo "Installing Grafana..."
    
    # Create values file with InfluxDB token
    cat > /tmp/grafana-values.yaml << EOF
grafana:
  image:
    repository: grafana/grafana
    tag: "10.2.3"
    pullPolicy: IfNotPresent
  
  service:
    type: NodePort
    port: 3000
    nodePort: 31300
  
  admin:
    username: admin
    password: admin123
  
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
    requests:
      cpu: 250m
      memory: 256Mi
  
  persistence:
    enabled: true
    size: 2Gi
    storageClass: ""

influxdb:
  token: "$INFLUXDB_TOKEN"
EOF

    # Install Grafana using Helm
    helm upgrade --install grafana ./helm/nrt-base-1/charts/grafana \
        --namespace ridenext-nonrt \
        --values /tmp/grafana-values.yaml \
        --create-namespace
    
    # Clean up temporary file
    rm -f /tmp/grafana-values.yaml
    
    echo "Grafana installation completed."
}

# Function to wait for Grafana to be ready
wait_for_grafana() {
    echo "Waiting for Grafana to be ready..."
    
    kubectl wait --for=condition=ready pod -l app=grafana -n ridenext-nonrt --timeout=300s
    
    echo "Grafana is ready!"
}

# Function to display access information
display_access_info() {
    echo ""
    echo "======================="
    echo "Grafana Installation Complete!"
    echo "======================="
    echo ""
    
    # Get cluster IP
    CLUSTER_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
    
    echo "Grafana Access Information:"
    echo "- URL: http://$CLUSTER_IP:31300"
    echo "- Username: admin"
    echo "- Password: admin123"
    echo ""
    echo "Pre-configured Dashboards:"
    echo "- PM Data Monitoring Dashboard"
    echo "- Network Performance Dashboard"
    echo ""
    echo "InfluxDB Data Sources:"
    echo "- InfluxDB (pm_data bucket)"
    echo "- InfluxDB-pm-bucket (pm-bucket bucket)"
    echo ""
    echo "Note: If you're running on a local cluster, you may need to use 'localhost' instead of $CLUSTER_IP"
    echo ""
}

# Main execution
main() {
    echo "Starting Grafana installation process..."
    
    check_influxdb
    get_influxdb_token
    install_grafana
    wait_for_grafana
    display_access_info
    
    echo "Grafana installation process completed successfully!"
}

# Run main function
main "$@"

#!/bin/bash

echo "Fixing Kafka/Strimzi installation with proper ordering..."

# Delete existing resources
echo "Cleaning up existing resources..."
kubectl delete kafka kafka-1 -n ridenext-nonrt --ignore-not-found=true
helm uninstall strimzi-kafka-crds -n ridenext-nonrt --ignore-not-found
sleep 10

# Install Strimzi operator
echo "Installing Strimzi operator..."
helm repo add strimzi https://strimzi.io/charts/ 2>/dev/null || true
helm install --wait strimzi-kafka-crds -n ridenext-nonrt strimzi/strimzi-kafka-operator --version 0.39.0

# Scale down operator immediately
echo "Scaling down operator temporarily..."
kubectl scale deployment strimzi-cluster-operator -n ridenext-nonrt --replicas=0
sleep 5

# Create Kafka resource
echo "Creating Kafka resource..."
cd /home/bluefox/Manish/performance/rn-smo/install/demo
helm upgrade --install -n ridenext-nonrt  nrt-base-1 helm/nrt-base-1
sleep 5

# Scale up operator to create Zookeeper
echo "Scaling up operator to create Zookeeper..."
kubectl scale deployment strimzi-cluster-operator -n ridenext-nonrt  --replicas=1
sleep 10

# Wait for Zookeeper
echo "Waiting for Zookeeper pods..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=zookeeper -n ridenext-nonrt  --timeout=300s
if [ $? -ne 0 ]; then
    echo "ERROR: Zookeeper failed"
    exit 1
fi
echo "Zookeeper ready!"

# Restart operator to trigger Kafka broker creation
echo "Restarting operator for Kafka broker..."
kubectl delete pod -n ridenext-nonrt  -l name=strimzi-cluster-operator
sleep 30

# Wait for Kafka broker
echo "Waiting for Kafka broker..."
timeout=180
elapsed=0
while ! kubectl get pod kafka-1-kafka-0 -n ridenext-nonrt &> /dev/null; do
    if [ $elapsed -ge $timeout ]; then
        echo "ERROR: Kafka broker not created"
        exit 1
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    echo -n "."
done
echo ""

kubectl wait --for=condition=ready pod/kafka-1-kafka-0 -n ridenext-nonrt --timeout=300s

# Test
echo "Testing Kafka..."
timeout=60
elapsed=0
while ! kubectl exec -n ridenext-nonrt kafka-client -- kafka-topics --list --bootstrap-server kafka-1-kafka-bootstrap.ridenext-nonrt:9092 &> /dev/null; do
    if [ $elapsed -ge $timeout ]; then
        echo "ERROR: Kafka not ready"
        exit 1
    fi
    sleep 5
    elapsed=$((elapsed + 5))
    echo -n "."
done
echo ""

echo "SUCCESS! Kafka is ready!"
kubectl get pods -n ridenext-nonrt | grep kafka

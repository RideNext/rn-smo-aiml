#!/bin/bash

# Script to generate certificates for A1PMS and create the Kubernetes secret

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" > /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "${ROOT_DIR}"

echo "Generating certificates for A1PMS..."

# Create a temporary directory for cert generation
mkdir -p certs
cd certs

# Passwords from application.yaml
PASSWORD="policy_agent"

# 1. Generate keystore with self-signed certificate
echo "Generating keystore.jks..."
keytool -genkeypair -alias policy_agent -keyalg RSA -keysize 2048 -storetype JKS \
  -keystore keystore.jks -validity 3650 -storepass "$PASSWORD" -keypass "$PASSWORD" \
  -dname "CN=policymanagementservice, OU=NonRTRIC, O=OpenInfra, L=Stockholm, S=Stockholm, C=SE"

# 2. Export the certificate
echo "Exporting certificate..."
keytool -exportcert -alias policy_agent -keystore keystore.jks -storepass "$PASSWORD" -file policy_agent.crt

# 3. Create truststore and import the certificate
echo "Generating truststore.jks..."
keytool -importcert -alias policy_agent -file policy_agent.crt -keystore truststore.jks \
  -storepass "$PASSWORD" -noprompt

# 4. Create the Kubernetes secret
echo "Creating Kubernetes secret 'a1pms-certs'..."
kubectl create secret generic a1pms-certs -n ridenext-nonrt \
  --from-file=keystore.jks \
  --from-file=truststore.jks \
  --dry-run=client -o yaml | kubectl apply -f -

# Cleanup
cd ..
rm -rf certs

echo "Certificates generated and secret created successfully."

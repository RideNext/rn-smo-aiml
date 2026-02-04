#!/bin/bash

# Script to create energy-saving policies for 15 cells

A1PMS_URL="http://localhost:31850"

# Define 15 cell IDs (matching typical RAN cell naming)
CELLS=(
  "ManagedElement=1,GNBDUFunction=1,NRCellDU=Cell-1"
  "ManagedElement=1,GNBDUFunction=1,NRCellDU=Cell-2"
  "ManagedElement=1,GNBDUFunction=1,NRCellDU=Cell-3"
  "ManagedElement=2,GNBDUFunction=1,NRCellDU=Cell-4"
  "ManagedElement=2,GNBDUFunction=1,NRCellDU=Cell-5"
  "ManagedElement=2,GNBDUFunction=1,NRCellDU=Cell-6"
  "ManagedElement=3,GNBDUFunction=1,NRCellDU=Cell-7"
  "ManagedElement=3,GNBDUFunction=1,NRCellDU=Cell-8"
  "ManagedElement=3,GNBDUFunction=1,NRCellDU=Cell-9"
  "ManagedElement=4,GNBDUFunction=1,NRCellDU=Cell-10"
  "ManagedElement=4,GNBDUFunction=1,NRCellDU=Cell-11"
  "ManagedElement=4,GNBDUFunction=1,NRCellDU=Cell-12"
  "ManagedElement=5,GNBDUFunction=1,NRCellDU=Cell-13"
  "ManagedElement=5,GNBDUFunction=1,NRCellDU=Cell-14"
  "ManagedElement=5,GNBDUFunction=1,NRCellDU=Cell-15"
)

echo "=========================================="
echo "Creating Energy Saving Policies for 15 Cells"
echo "=========================================="
echo ""

# Simulate different utilization levels and actions
UTILIZATIONS=(15 25 18 65 75 22 12 80 45 30 70 55 10 85 50)
ACTIONS=()

for i in "${!CELLS[@]}"; do
  CELL_ID="${CELLS[$i]}"
  UTIL="${UTILIZATIONS[$i]}"
  
  # Determine action based on utilization
  if (( $(echo "$UTIL < 40" | bc -l) )); then
    ACTION="switch_off"
    REASON="low_traffic_energy_saving"
    THRESHOLD=40
  else
    ACTION="switch_on"
    REASON="optimal_traffic_level"
    THRESHOLD=50
  fi
  
  # Alternate between ric1 and ric2
  if (( i % 2 == 0 )); then
    RIC_ID="ric1"
  else
    RIC_ID="ric2"
  fi
  
  # Create policy ID
  POLICY_ID="energy_save_cell_$(printf "%03d" $((i+1)))"
  
  # Create timestamp
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  echo "[$((i+1))/15] Creating policy: $POLICY_ID"
  echo "  Cell: $CELL_ID"
  echo "  RIC: $RIC_ID"
  echo "  Utilization: ${UTIL}%"
  echo "  Action: $ACTION"
  
  # Create policy JSON
  POLICY_JSON=$(cat <<EOF
{
  "policy_id": "$POLICY_ID",
  "policytype_id": "2",
  "ric_id": "$RIC_ID",
  "service_id": "energy-saving-rapp",
  "policy_data": {
    "cell_id": "$CELL_ID",
    "action": "$ACTION",
    "reason": "$REASON",
    "utilization": $UTIL,
    "threshold": $THRESHOLD,
    "timestamp": "$TIMESTAMP"
  }
}
EOF
)
  
  # Send policy to A1PMS
  RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$A1PMS_URL/a1-policy/v2/policies" \
    -H 'Content-Type: application/json' \
    -d "$POLICY_JSON")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "  ✓ Policy created successfully"
  else
    echo "  ✗ Failed to create policy (HTTP $HTTP_CODE)"
  fi
  
  echo ""
done

echo ""
echo "=========================================="
echo "Policy Creation Complete"
echo "=========================================="
echo ""
echo "Fetching policy summary..."
echo ""

# Get all policies
ALL_POLICIES=$(curl -s "$A1PMS_URL/a1-policy/v2/policies" | jq -r '.policy_ids | length')
echo "Total policies: $ALL_POLICIES"

# Get policies by RIC
RIC1_COUNT=$(curl -s "$A1PMS_URL/a1-policy/v2/policies?ric_id=ric1" | jq -r '.policy_ids | length')
RIC2_COUNT=$(curl -s "$A1PMS_URL/a1-policy/v2/policies?ric_id=ric2" | jq -r '.policy_ids | length')

echo "Policies on ric1: $RIC1_COUNT"
echo "Policies on ric2: $RIC2_COUNT"
echo ""

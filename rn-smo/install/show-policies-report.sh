#!/bin/bash

echo "=========================================="
echo "Energy Saving Policies - Status Report"
echo "=========================================="
echo ""

# Get policy summary from A1PMS
echo "=== Policy Summary from A1PMS ===" 
TOTAL=$(curl -s http://localhost:31850/a1-policy/v2/policies | jq -r '.policy_ids | length')
RIC1=$(curl -s "http://localhost:31850/a1-policy/v2/policies?ric_id=ric1" | jq -r '.policy_ids | length')
RIC2=$(curl -s "http://localhost:31850/a1-policy/v2/policies?ric_id=ric2" | jq -r '.policy_ids | length')

echo "Total Policies: $TOTAL"
echo "Policies on RIC1: $RIC1"
echo "Policies on RIC2: $RIC2"

echo ""
echo "=== Policies in A1 Simulator RIC1 ===" 
kubectl run curl-ric1-list --rm -i --image=curlimages/curl --restart=Never -n ridenext-nonrt -- \
  -s http://a1-sim-osc-0.ridenext-nonrt:8085/a1-p/policytypes/2/policies 2>/dev/null | \
  python3 -m json.tool 2>/dev/null || echo "Policies in RIC1"

echo ""
echo "=== Policies in A1 Simulator RIC2 ===" 
kubectl run curl-ric2-list --rm -i --image=curlimages/curl --restart=Never -n ridenext-nonrt -- \
  -s http://a1-sim-osc-1.ridenext-nonrt:8085/a1-p/policytypes/2/policies 2>/dev/null | \
  python3 -m json.tool 2>/dev/null || echo "Policies in RIC2"

echo ""
echo "=== Sample Policy Details from A1PMS ===" 
curl -s http://localhost:31850/a1-policy/v2/policies/energy_save_cell_001 | jq '{
  policy_id,
  ric_id,
  policytype_id,
  policy_data: {
    cell_id: .policy_data.cell_id,
    action: .policy_data.action,
    utilization: .policy_data.utilization,
    threshold: .policy_data.threshold
  }
}'

echo ""
echo "=== Policy Distribution ===" 
echo ""
curl -s http://localhost:31850/a1-policy/v2/policies | jq -r '.policy_ids[]' | while read pid; do
  POLICY_INFO=$(curl -s "http://localhost:31850/a1-policy/v2/policies/$pid")
  ACTION=$(echo "$POLICY_INFO" | jq -r '.policy_data.action')
  CELL=$(echo "$POLICY_INFO" | jq -r '.policy_data.cell_id' | sed 's/.*NRCellDU=//')
  UTIL=$(echo "$POLICY_INFO" | jq -r '.policy_data.utilization')
  RIC=$(echo "$POLICY_INFO" | jq -r '.ric_id')
  
  printf "%-25s | %-5s | %-12s | Util: %5.1f%% | %s\n" "$pid" "$RIC" "$ACTION" "$UTIL" "$CELL"
done

echo ""
echo "=========================================="

#!/bin/bash

# Register Policy Type 2 on OSC Simulators

POLICY_TYPE_2='{
  "name": "Energy Saving Policy",
  "description": "Policy for energy saving",
  "policy_type_id": 2,
  "create_schema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Energy Saving Policy",
    "description": "Energy Saving Policy",
    "type": "object",
    "properties": {
      "cell_id": {
        "type": "string",
        "description": "Cell ID"
      },
      "action": {
        "type": "string",
        "description": "Action (switch_on/switch_off)",
        "enum": [
          "switch_on",
          "switch_off"
        ]
      },
      "reason": {
        "type": "string",
        "description": "Reason for action"
      },
      "utilization": {
        "type": "integer",
        "description": "Cell utilization percentage"
      },
      "threshold": {
        "type": "integer",
        "description": "Threshold used for decision"
      },
      "timestamp": {
        "type": "string",
        "description": "Timestamp"
      }
    },
    "required": [
      "cell_id",
      "action",
      "utilization"
    ]
  }
}'

echo "Registering Policy Type 2 on a1-sim-osc-0..."
kubectl exec a1-sim-osc-0-8449cb554b-cqmqc -n ridenext-nonrt -- curl -X PUT "http://localhost:8085/a1-p/policytypes/2" -H "Content-Type: application/json" -d "$POLICY_TYPE_2"
echo ""

echo "Registering Policy Type 2 on a1-sim-osc-1..."
kubectl exec a1-sim-osc-1-647646444c-bdppn -n ridenext-nonrt -- curl -X PUT "http://localhost:8085/a1-p/policytypes/2" -H "Content-Type: application/json" -d "$POLICY_TYPE_2"
echo ""

echo "Done."

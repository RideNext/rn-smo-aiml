# Near RT RIC Configuration

This directory contains the configuration for all 6 near RT RIC simulators used in the Energy Saving rApp demo.

## RIC Simulators Overview

The system is configured with **6 near RT RIC simulators**:

| RIC Name | Type | Service Endpoint | Managed Elements |
|----------|------|-----------------|------------------|
| ric1 | OSC | a1-sim-osc-0.ridenext-nonrt:8085 | me1, me2 |
| ric2 | OSC | a1-sim-osc-1.ridenext-nonrt:8085 | me3, me4 |
| ric3 | STD | a1-sim-std-0.ridenext-nonrt:8085 | me5, me6 |
| ric4 | STD | a1-sim-std-1.ridenext-nonrt:8085 | me7, me8 |
| ric5 | STD2 | a1-sim-std2-0.ridenext-nonrt:8085 | me9, me10 |
| ric6 | STD2 | a1-sim-std2-1.ridenext-nonrt:8085 | me11, me12 |

## Configuration Files

### Primary Configuration
- **File**: `deployments/a1pms-deployment.yaml`
- **Purpose**: Defines the Policy Management Service deployment and ConfigMap with all 6 RICs
- **Used by**: `scripts/deploy-a1-components.sh` during installation

### How It Works
The Policy Management Service (A1PMS) discovers and manages all near RT RICs through its configuration. The `a1pms-config` ConfigMap contains:

1. **RIC Endpoints**: URLs for each A1 simulator
2. **Managed Elements**: Logical grouping of network elements per RIC
3. **Application Settings**: Service configuration parameters

## Persistence

The configuration is persistent across:
- ✅ Pod restarts
- ✅ Deployment updates
- ✅ System reinstalls (when using `install-demo.sh` or `deploy-a1-components.sh`)

## Verifying RIC Configuration

To verify all 6 RICs are properly configured:

```bash
# Check number of RICs
curl -s http://localhost:31850/a1-policy/v2/rics | jq '.rics | length'

# List all RICs with details
curl -s http://localhost:31850/a1-policy/v2/rics | jq '.rics[] | {name: .ric_id, managed_elements: .managed_element_ids}'
```

Expected output: **6 RICs**

## Troubleshooting

If you see fewer than 6 RICs:

1. **Check ConfigMap**:
   ```bash
   kubectl get configmap a1pms-config -n ridenext-nonrt -o yaml
   ```

2. **Verify A1 Simulators are running**:
   ```bash
   kubectl get pods -n ridenext-nonrt | grep a1-sim
   ```
   Should show 6 pods: a1-sim-osc-0, a1-sim-osc-1, a1-sim-std-0, a1-sim-std-1, a1-sim-std2-0, a1-sim-std2-1

3. **Re-apply configuration**:
   ```bash
   kubectl apply -f deployments/a1pms-deployment.yaml
   kubectl rollout restart deployment policymanagementservice -n ridenext-nonrt
   ```

## Updating RIC Configuration

To modify the RIC configuration:

1. Edit `deployments/a1pms-deployment.yaml`
2. Update the `application_configuration.json` section in the ConfigMap
3. Apply changes:
   ```bash
   kubectl apply -f deployments/a1pms-deployment.yaml
   kubectl rollout restart deployment policymanagementservice -n ridenext-nonrt
   ```

## Dashboard Integration

The RIC details are displayed in the **Policy View** tab of the visualization dashboard. All 6 RICs should be visible with their managed elements and policy types.

---

**Last Updated**: 2025-11-26  
**Configuration Version**: 6 RICs (ric1-ric6)

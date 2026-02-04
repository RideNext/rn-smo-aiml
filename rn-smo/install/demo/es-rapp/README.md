# Simple Energy Saving rApp (No SME Required)

This is a simplified Energy Saving rApp that works **without SME** (Service Management and Exposure). It connects directly to InfluxDB and Policy Management Service.

## Features

- ✅ Direct InfluxDB connection (no SME needed)
- ✅ Queries PM data every minute
- ✅ Calculates cell utilization
- ✅ Makes energy saving decisions based on thresholds
- ✅ Sends A1 policies to Policy Management Service
- ✅ Tracks cell on/off states

## Prerequisites

- InfluxDB running at `http://influxdb2.ridenext-nonrt:8086`
- Policy Management Service running at `http://policymanagementservice.ridenext-nonrt:8081`
- PM data flowing to InfluxDB

## Build and Deploy

### 1. Build Docker Image

```bash
cd /home/bluefox/Manish/performance/rn-smo/install/demo/es-rapp

# Build the image
docker build -t simple-energy-rapp:latest .
```

### 2. Deploy to Kubernetes

```bash
# Deploy the rApp
kubectl apply -f deployment.yaml

# Check if it's running
kubectl get pods -n ridenext-nonrt | grep simple-energy-rapp

# View logs
kubectl logs -f -n ridenext-nonrt -l app=simple-energy-rapp
```

## Configuration

Environment variables (can be modified in `deployment.yaml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `INFLUXDB_URL` | `http://influxdb2.ridenext-nonrt:8086` | InfluxDB URL |
| `INFLUXDB_TOKEN` | `mySuP3rS3cr3tT0keN` | InfluxDB token |
| `INFLUXDB_BUCKET` | `pm_data` | InfluxDB bucket name |
| `POLICY_MGMT_URL` | `http://policymanagementservice.ridenext-nonrt:8081` | Policy Management Service URL |
| `LOW_UTIL_THRESHOLD` | `20.0` | Turn off cell if utilization < this % |
| `HIGH_UTIL_THRESHOLD` | `70.0` | Turn on cell if utilization > this % |

## How It Works

1. **Query PM Data**: Queries InfluxDB every 60 seconds for cell throughput metrics
2. **Calculate Utilization**: Estimates PRB utilization from throughput data
3. **Make Decision**: 
   - If utilization < 20% → Send policy to switch OFF cell
   - If utilization > 70% → Send policy to switch ON cell
4. **Send A1 Policy**: Sends policy to Policy Management Service
5. **Track State**: Maintains cell on/off state to avoid redundant policies

## Expected Logs

```
2025-11-19 18:45:00 - INFO - ================================================================================
2025-11-19 18:45:00 - INFO - Energy Saving rApp Started
2025-11-19 18:45:00 - INFO - InfluxDB: http://influxdb2.ridenext-nonrt:8086
2025-11-19 18:45:00 - INFO - Policy Management: http://policymanagementservice.ridenext-nonrt:8081
2025-11-19 18:45:00 - INFO - Low Utilization Threshold: 20.0%
2025-11-19 18:45:00 - INFO - High Utilization Threshold: 70.0%
2025-11-19 18:45:00 - INFO - ================================================================================
2025-11-19 18:45:00 - INFO - ✓ Connected to InfluxDB at http://influxdb2.ridenext-nonrt:8086
2025-11-19 18:45:00 - INFO - 
--- Iteration 1 ---
2025-11-19 18:45:00 - INFO - Retrieved PM data for 2 cells
2025-11-19 18:45:00 - INFO - 🔴 Cell NRCellDU=1: Low utilization (15.2%) - Recommending SWITCH OFF
2025-11-19 18:45:00 - INFO - ✓ Successfully sent A1 policy: energy_save_NRCellDU_1_1700412300 (switch_off)
2025-11-19 18:45:00 - INFO - Iteration 1 complete: 1 policies sent
```

## Troubleshooting

### rApp not connecting to InfluxDB
```bash
# Check InfluxDB is running
kubectl get pods -n ridenext-nonrt | grep influx

# Test InfluxDB connection
kubectl run -it --rm test --image=curlimages/curl --restart=Never -n ridenext-nonrt -- \
  curl -v http://influxdb2.ridenext-nonrt:8086/health
```

### No PM data found
```bash
# Check if PM data exists in InfluxDB
kubectl port-forward -n ridenext-nonrt influxdb2-0 8086:8086
# Access UI at http://localhost:8086 (admin / mySuP3rS3cr3tT0keN)
# Query: from(bucket: "pm_data") |> range(start: -1h)
```

### Policy Management Service not reachable
```bash
# Check if Policy Management Service is running
kubectl get pods -n ridenext-nonrt | grep policymanagement

# If not running, you need to install it first
```

## Next Steps

1. **Install Policy Management Service** (if not already running)
2. **Build and deploy this rApp**
3. **Monitor logs** to see energy saving decisions
4. **Adjust thresholds** based on your network requirements

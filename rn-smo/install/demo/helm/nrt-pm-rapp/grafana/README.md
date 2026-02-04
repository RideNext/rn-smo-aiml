# Grafana Helm Chart for PM Data Visualization

This Helm chart deploys Grafana with pre-configured dashboards for visualizing Performance Management (PM) data from InfluxDB.

## Features

- **Pre-configured InfluxDB Data Sources**: Automatically connects to both `pm_data` and `pm-bucket` buckets
- **Built-in Dashboards**: 
  - PM Data Monitoring Dashboard - Comprehensive view of all PM counters
  - Network Performance Dashboard - Focused on network KPIs
- **NodePort Service**: Accessible via port 31300
- **Persistent Storage**: Grafana data persists across restarts
- **Authentication**: Default admin/admin123 credentials

## Prerequisites

- Kubernetes cluster with InfluxDB running in `ridenext-nonrt` namespace
- Helm 3.x installed
- kubectl configured to access the cluster

## Installation

### Quick Installation

Use the provided installation script:

```bash
cd install
./install-grafana.sh
```

### Manual Installation

1. Get InfluxDB token:
```bash
INFLUXDB_TOKEN=$(kubectl exec -n ridenext-nonrt influxdb2-0 -- influx auth list --org est --json | jq -r '.[0].token')
```

2. Install with Helm:
```bash
helm install grafana ./helm/nrt-base-1/charts/grafana \
  --namespace ridenext-nonrt \
  --set influxdb.token="$INFLUXDB_TOKEN" \
  --create-namespace
```

## Access

After installation, Grafana will be available at:
- **URL**: `http://<cluster-ip>:31300`
- **Username**: `admin`
- **Password**: `admin123`

## Dashboard Overview

### PM Data Monitoring Dashboard

- **PM Counters Over Time**: Time series visualization of all PM counters
- **Total PM Data Points**: Current count of data points
- **Data Distribution**: Pie chart showing distribution across measurements
- **Granularity Period**: Visualization of data collection intervals
- **Detailed PM Counters**: Comprehensive view of all counters by field

### Network Performance Dashboard

- **Network Throughput**: Visualization of throughput/bitrate metrics
- **Resource Utilization**: CPU, memory, and network utilization metrics

## Configuration

### Values.yaml Structure

```yaml
grafana:
  image:
    repository: grafana/grafana
    tag: "10.2.3"
  service:
    type: NodePort
    nodePort: 31300
  admin:
    username: admin
    password: admin123
  persistence:
    enabled: true
    size: 2Gi
```

### Custom Dashboards

To add custom dashboards:

1. Create JSON dashboard files in `dashboards/` directory
2. Add them to the `configmap-dashboards.yaml` template
3. Upgrade the Helm release

## Troubleshooting

### Common Issues

1. **InfluxDB Connection Failed**
   - Verify InfluxDB is running: `kubectl get pods -n ridenext-nonrt | grep influxdb`
   - Check token: `kubectl logs -n ridenext-nonrt grafana-xxx`

2. **Dashboard Not Loading**
   - Check ConfigMap: `kubectl get configmap -n ridenext-nonrt grafana-dashboards`
   - Restart Grafana: `kubectl delete pod -n ridenext-nonrt -l app=grafana`

3. **Storage Issues**
   - Check PVC: `kubectl get pvc -n ridenext-nonrt grafana-pvc`
   - Verify storage class exists

### Useful Commands

```bash
# Check Grafana logs
kubectl logs -n ridenext-nonrt -l app=grafana

# Access Grafana pod
kubectl exec -it -n ridenext-nonrt -l app=grafana -- bash

# Port forward for local access
kubectl port-forward -n ridenext-nonrt svc/grafana 3000:3000
```

## Uninstallation

```bash
helm uninstall grafana -n ridenext-nonrt
kubectl delete pvc grafana-pvc -n ridenext-nonrt
```

## Data Sources

The chart automatically configures two InfluxDB data sources:

1. **InfluxDB** (Default)
   - Bucket: `pm_data`
   - Organization: `est`
   - URL: `http://influxdb2.ridenext-nonrt:8086`

2. **InfluxDB-pm-bucket**
   - Bucket: `pm-bucket`
   - Organization: `est`
   - URL: `http://influxdb2.ridenext-nonrt:8086`

## Security Considerations

- Change default admin password in production
- Consider enabling HTTPS for production deployments
- Restrict access using Kubernetes NetworkPolicies if needed

## Support

For issues and questions, refer to the main project documentation or create an issue in the project repository.

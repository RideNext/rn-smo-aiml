# rApp Manager Helm Chart

This Helm chart deploys the rApp Manager component for the O-RAN SC NonRTRIC platform.

## Overview

The rApp Manager is responsible for managing rApp (RAN Application) lifecycle including:
- rApp onboarding and deployment
- Integration with ACM (Automation Composition Management)
- Integration with SME (Service Management and Exposure)
- Integration with DME (Data Management and Exposure)

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- NFS storage provisioner (or another storage class)
- NonRTRIC components (ICS, Policy Management Service)

## Installation

### Using the demo installation script (Recommended)

```bash
cd /home/bluefox/Manish/performance/rn-smo/install/demo
./install-demo.sh
```

The rApp Manager will be installed automatically as part of Layer 1.5.

### Manual installation

```bash
# Install using Helm
helm install rappmanager ./helm/rappmanager \
  --namespace nonrtric \
  --create-namespace

# Or use the installation script
cd scripts
./install-rappmanager.sh
```

## Configuration

### Key Configuration Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Container image repository | `nexus3.o-ran-sc.org:10002/o-ran-sc/nonrtric-plt-rappmanager` |
| `image.tag` | Container image tag | `0.3.0` |
| `service.type` | Kubernetes service type | `ClusterIP` |
| `service.port` | Service port | `8080` |
| `persistence.enabled` | Enable persistent storage | `true` |
| `persistence.size` | Storage size | `2Gi` |
| `persistence.storageClass` | Storage class name | `nfs-client` |

### Environment Variables

The following environment variables are configured by default:

- `RAPPMANAGER_ACM_BASEURL`: ACM service endpoint
- `RAPPMANAGER_SME_BASEURL`: SME service endpoint
- `RAPPMANAGER_DME_BASEURL`: DME/ICS service endpoint
- `RAPPMANAGER_CSARLOCATION`: CSAR storage location

### Custom Values

Create a custom values file:

```yaml
# custom-values.yaml
replicaCount: 2

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

persistence:
  size: 5Gi
```

Install with custom values:

```bash
helm install rappmanager ./helm/rappmanager \
  --namespace nonrtric \
  -f custom-values.yaml
```

## Accessing rApp Manager

### Port Forwarding

```bash
kubectl port-forward svc/rappmanager 8080:8080 -n nonrtric
```

Then access the API at: http://localhost:8080

### API Endpoints

- Health check: `GET /actuator/health`
- rApp catalog: `GET /rapps`
- Deploy rApp: `POST /rapps/{rappId}/deploy`
- Undeploy rApp: `POST /rapps/{rappId}/undeploy`

## Verification

Check the deployment status:

```bash
# Check pods
kubectl get pods -n nonrtric | grep rappmanager

# Check service
kubectl get svc -n nonrtric | grep rappmanager

# Check logs
kubectl logs -f deployment/rappmanager -n nonrtric

# Check health
kubectl port-forward svc/rappmanager 8080:8080 -n nonrtric &
curl http://localhost:8080/actuator/health
```

## Troubleshooting

### Pod not starting

Check pod events:
```bash
kubectl describe pod -l app.kubernetes.io/name=rappmanager -n nonrtric
```

Check logs:
```bash
kubectl logs -l app.kubernetes.io/name=rappmanager -n nonrtric
```

### Storage issues

Check PVC status:
```bash
kubectl get pvc -n nonrtric | grep rappmanager
```

Ensure NFS provisioner is running:
```bash
kubectl get pods -n default | grep nfs
```

### Connection issues

Verify dependent services are running:
```bash
kubectl get pods -n nonrtric | grep -E "informationservice|capifcore|policy"
```

## Uninstallation

### Using the demo uninstallation script

```bash
cd /home/bluefox/Manish/performance/rn-smo/install/demo
./uninstall-demo.sh
```

### Manual uninstallation

```bash
# Using the uninstall script
cd scripts
./uninstall-rappmanager.sh

# Or using Helm directly
helm uninstall rappmanager -n nonrtric

# Clean up PVC
kubectl delete pvc rappmanager-pvc -n nonrtric
```

## Integration with Demo

The rApp Manager is integrated into the complete demo installation:

1. **Layer 0**: RANPM components (Kafka, ICS)
2. **Layer 1**: NonRTRIC components (Policy Management, A1 Controller)
3. **Layer 1.5**: rApp Manager ← You are here
4. **Layer 2**: A1 Simulators
5. **Layer 3**: Energy Saving rApp & UI
6. **Layer 4**: PM Data Producer

## References

- [rApp Manager Documentation](https://docs.o-ran-sc.org/projects/o-ran-sc-nonrtric-plt-rappmanager)
- [O-RAN SC NonRTRIC](https://wiki.o-ran-sc.org/display/RICNR)
- [Demo Installation Guide](../README.md)

## License

Copyright (C) 2024 OpenInfra Foundation Europe. All rights reserved.
Licensed under the Apache License, Version 2.0.

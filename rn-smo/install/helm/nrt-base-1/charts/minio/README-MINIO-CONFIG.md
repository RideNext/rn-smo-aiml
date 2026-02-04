# Minio Configuration

## Changes Made

1. **Disabled SSO by default**: The `MINIO_IDENTITY_OPENID_CONFIG_URL` environment variable is now conditionally set based on the `minio.auth.sso_enabled` value in values.yaml.

2. **Added configuration options** in values.yaml:
   - `minio.auth.sso_enabled`: Set to `false` to disable SSO (default)
   - `minio.auth.root_user`: Minio admin username (default: admin)
   - `minio.auth.root_password`: Minio admin password (default: adminadmin)

## To redeploy with changes

If you need to redeploy Minio with the updated configuration:

```bash
# Navigate to the install directory
cd /home/bluefox/Manish/performance/smart5g-nonrtric-plt-ranpm/install

# Upgrade the helm release
helm upgrade nrt-base-1 ./helm/nrt-base-1 -n nonrtric
```

## Access Minio

- **Web UI**: Access via NodePort service (check with `kubectl get svc minio-web -n nonrtric`)
- **Username**: admin
- **Password**: adminadmin

## Enable SSO (if needed)

To enable SSO in the future, update values.yaml:

```yaml
minio:
  auth:
    sso_enabled: true
```

Then redeploy the chart.

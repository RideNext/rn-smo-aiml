# rApp Manager UI Integration Guide

## Overview

The rApp Manager UI is now integrated into the Maven build system and can be built alongside the backend services.

## Build Integration

The UI module is integrated into the parent POM and will:
1. Run `npm install` during the `generate-resources` phase
2. Run `npm run build` during the `compile` phase
3. Copy the built UI to `rapp-manager-application/src/main/resources/static` for embedded deployment
4. Build a Docker image during the `package` phase

## Build Commands

### Build Everything (Backend + UI)
```bash
mvn clean install
```

### Build Only UI Module
```bash
cd rapp-manager-ui
mvn clean install
```

### Skip UI Build
```bash
mvn clean install -pl !rapp-manager-ui
```

## Deployment Options

### Option 1: Embedded UI (Single JAR)
The UI is automatically copied to the backend's static resources and served at `http://localhost:8081/`

```bash
java -jar rapp-manager-application/target/rapp-manager-application-0.3.1-SNAPSHOT.jar
```

Access UI at: `http://localhost:8081/`

### Option 2: Separate Containers (Docker Compose)
Run backend and UI as separate containers:

```bash
docker-compose up
```

- Backend: `http://localhost:8081`
- UI: `http://localhost:3000`

### Option 3: Development Mode
For UI development with hot reload:

```bash
cd rapp-manager-ui
npm install
npm run dev
```

UI runs on `http://localhost:3000` and proxies API calls to `http://localhost:8081`

## Docker Images

Two Docker images are created:

1. **Backend**: `o-ran-sc/nonrtric-plt-rappmanager:0.3.1-SNAPSHOT`
2. **UI**: `o-ran-sc/nonrtric-plt-rappmanager-ui:0.3.1-SNAPSHOT`

Build images:
```bash
mvn clean package
```

## Configuration

### Backend Port
The backend runs on port 8081 by default. Update in `application.yaml`:
```yaml
server:
  port: 8081
```

### UI API Proxy
For development, update `vite.config.ts`:
```typescript
proxy: {
  '/rapps': {
    target: 'http://localhost:8081'
  }
}
```

For production (nginx), update `nginx.conf`:
```nginx
location /rapps {
    proxy_pass http://rapp-manager-backend:8080;
}
```

## Project Structure

```
nonrtric-plt-rappmanager/
├── rapp-manager-ui/           # UI module
│   ├── src/                   # React source code
│   ├── dist/                  # Build output (generated)
│   ├── pom.xml               # Maven build config
│   ├── package.json          # npm dependencies
│   ├── Dockerfile            # UI container image
│   └── nginx.conf            # nginx config for production
├── rapp-manager-application/  # Backend module
│   └── src/main/resources/
│       └── static/           # UI files copied here (generated)
├── docker-compose.yml        # Multi-container setup
└── pom.xml                   # Parent POM (includes UI module)
```

## Prerequisites

- Java 17+
- Maven 3.6+
- Node.js 18+
- npm 9+
- Docker (optional, for containerized deployment)

## Troubleshooting

### UI not building
- Ensure Node.js and npm are installed: `node -v && npm -v`
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### API calls failing
- Check backend is running on port 8081
- Verify CORS configuration in backend
- Check browser console for errors

### Static files not served
- Ensure UI build completed: check `rapp-manager-application/src/main/resources/static/`
- Verify WebConfiguration.java is present
- Check Spring Boot logs for static resource mapping

## CI/CD Integration

The UI build is part of the standard Maven lifecycle:

```bash
# Jenkins/GitHub Actions
mvn clean verify
mvn package
docker build -t rapp-manager-ui:${VERSION} rapp-manager-ui/
```

## Next Steps

1. Configure authentication/authorization
2. Add environment-specific configurations
3. Set up monitoring and logging
4. Implement E2E tests

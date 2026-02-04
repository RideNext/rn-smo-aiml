# rApp Manager UI

React + TypeScript frontend for the 5G Non-RT RIC rApp Management Platform.

## Features

- **rApp Catalog**: Browse and onboard rApp packages
- **Instance Management**: Deploy, monitor, and control rApp instances
- **Authentication**: JWT-based secure access
- **Real-time Updates**: Auto-refresh every 5 seconds

## Tech Stack

- React 18 + TypeScript
- React Router for navigation
- TanStack Query for data fetching
- Axios for API calls
- Vite for build tooling

## Setup

```bash
npm install
npm run dev
```

The UI will run on `http://localhost:3000` and proxy API calls to `http://localhost:8080`.

## Backend Integration

The UI expects the rApp Manager backend to be running on port 8080 with the following endpoints:

- `GET /rapps` - List all rApps
- `POST /rapps/{id}` - Onboard rApp package
- `PUT /rapps/{id}` - Prime/Deprime rApp
- `GET /rapps/{id}/instance` - List instances
- `PUT /rapps/{id}/instance/{instanceId}` - Deploy/Undeploy instance

## Configuration

Update `vite.config.ts` to change the backend URL:

```typescript
proxy: {
  '/rapps': {
    target: 'http://your-backend:8080'
  }
}
```

## Build

```bash
npm run build
```

Output will be in the `dist/` directory.

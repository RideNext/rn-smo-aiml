# rApp Manager UI - Project Overview

## Architecture

This is a minimal React + TypeScript frontend that integrates with the rApp Manager backend service.

### Directory Structure

```
rapp-manager-ui/
├── src/
│   ├── api/              # API client and backend integration
│   │   ├── client.ts     # Axios client with auth interceptors
│   │   └── rappApi.ts    # rApp API methods
│   ├── components/       # Reusable UI components
│   │   ├── Layout.tsx    # Main layout with sidebar navigation
│   │   └── DynamicForm.tsx # JSON Schema form renderer
│   ├── context/          # React Context providers
│   │   └── AuthContext.tsx # Authentication state management
│   ├── pages/            # Route pages
│   │   ├── Login.tsx     # Login page
│   │   ├── Catalog.tsx   # rApp catalog view
│   │   └── Instances.tsx # Instance management view
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # API types
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── Dockerfile            # Multi-stage Docker build
├── nginx.conf            # Nginx configuration for production
├── vite.config.ts        # Vite build configuration
└── package.json          # Dependencies and scripts
```

## Key Features Implemented

### 1. Authentication (Requirement: User Authentication)
- JWT token-based authentication
- AuthContext for global state management
- Token stored in localStorage
- Automatic redirect on 401 responses

### 2. rApp Catalog View (Requirement: Onboarding & rApp Catalog)
- Display all onboarded rApps in card layout
- Onboard new rApp packages via file upload
- Prime/Deprime rApp functionality
- Real-time state updates via polling (5s interval)

### 3. Instance Management (Requirement: rApp Instances & Monitoring)
- List all instances for selected rApp
- Deploy/Undeploy instance actions
- State monitoring with auto-refresh
- Confirmation dialogs for destructive actions

### 4. Dynamic Form Rendering (Requirement: Dynamic Deployment View)
- DynamicForm component for ASD input parameters
- Supports string, integer, boolean types
- Respects required fields and default values
- Validates based on schema constraints

### 5. Technical Requirements Met
- ✅ React + TypeScript
- ✅ React Router for client-side routing
- ✅ TanStack Query for state management and caching
- ✅ Axios API client with global error handling
- ✅ Responsive design (desktop optimized)
- ✅ Loading states and error handling

## API Integration

The UI integrates with the following backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/rapps` | GET | List all rApps |
| `/rapps/{id}` | GET | Get rApp details |
| `/rapps/{id}` | POST | Onboard rApp package |
| `/rapps/{id}` | PUT | Prime/Deprime rApp |
| `/rapps/{id}` | DELETE | Delete rApp |
| `/rapps/{id}/instance` | GET | List instances |
| `/rapps/{id}/instance` | POST | Create instance |
| `/rapps/{id}/instance/{instanceId}` | GET | Get instance details |
| `/rapps/{id}/instance/{instanceId}` | PUT | Deploy/Undeploy |
| `/rapps/{id}/instance/{instanceId}` | DELETE | Delete instance |

## Running the Application

### Development Mode
```bash
npm install
npm run dev
```
Access at `http://localhost:3000`

### Production Build
```bash
npm run build
npm run preview
```

### Docker Deployment
```bash
docker build -t rapp-manager-ui .
docker run -p 3000:80 rapp-manager-ui
```

### Full Stack with Docker Compose
```bash
cd /home/bluefox/Manish/performance/rappmanager
docker-compose up
```

## Configuration

### Backend URL
Update `vite.config.ts` to change the backend proxy:
```typescript
proxy: {
  '/rapps': {
    target: 'http://localhost:8080'
  }
}
```

### Polling Interval
Update `App.tsx` QueryClient configuration:
```typescript
defaultOptions: {
  queries: { refetchInterval: 5000 } // 5 seconds
}
```

## Future Enhancements

To fully meet all requirements, consider adding:

1. **Dashboard View** - Overview metrics and statistics
2. **Admin Panel** - User management and system configuration
3. **Live Logging** - Real-time log streaming from pods
4. **Metrics Visualization** - Charts for CPU/Memory/API metrics
5. **Advanced Filtering** - Search and filter by provider, type, etc.
6. **Notifications** - Toast messages for success/error states
7. **Component Library** - Material UI or Ant Design integration
8. **WebSocket Support** - Real-time updates instead of polling

## Security Considerations

- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- CORS configuration required on backend
- Input validation on all forms
- XSS protection via React's built-in escaping
- HTTPS required for production deployment

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Minimum resolution: 1280x800

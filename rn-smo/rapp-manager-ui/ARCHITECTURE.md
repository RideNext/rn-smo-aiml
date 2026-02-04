# rApp Manager UI - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Application (Port 3000)            │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   Login     │  │   Catalog    │  │ Instances  │  │  │
│  │  │    Page     │  │     Page     │  │    Page    │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────┘  │  │
│  │         │                 │                 │        │  │
│  │         └─────────────────┴─────────────────┘        │  │
│  │                          │                           │  │
│  │                  ┌───────▼────────┐                  │  │
│  │                  │  React Router  │                  │  │
│  │                  └───────┬────────┘                  │  │
│  │                          │                           │  │
│  │         ┌────────────────┴────────────────┐          │  │
│  │         │                                 │          │  │
│  │  ┌──────▼──────┐                 ┌───────▼──────┐   │  │
│  │  │ AuthContext │                 │ TanStack     │   │  │
│  │  │  (JWT)      │                 │   Query      │   │  │
│  │  └──────┬──────┘                 └───────┬──────┘   │  │
│  │         │                                 │          │  │
│  │         └────────────┬────────────────────┘          │  │
│  │                      │                               │  │
│  │              ┌───────▼────────┐                      │  │
│  │              │  Axios Client  │                      │  │
│  │              │  (API Client)  │                      │  │
│  │              └───────┬────────┘                      │  │
│  └──────────────────────┼───────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────┘
                          │
                          │ HTTP/REST
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                  Vite Dev Proxy                             │
│                  (Development)                              │
│                       OR                                    │
│                  Nginx Proxy                                │
│                  (Production)                               │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          │ /rapps/*
                          │
┌─────────────────────────▼──────────────────────────────────┐
│            rApp Manager Backend (Port 8080)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   rApp API   │  │ Instance API │  │   ACM/DME    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
src/
│
├── main.tsx                    # Entry point
│   └── App.tsx                 # Root component
│       │
│       ├── QueryClientProvider # TanStack Query setup
│       │   └── (5s polling, caching, retry)
│       │
│       ├── AuthProvider        # Authentication context
│       │   └── (JWT token management)
│       │
│       └── BrowserRouter       # Routing
│           │
│           ├── /login          # Public route
│           │   └── Login.tsx
│           │
│           └── /               # Protected routes
│               └── Layout.tsx  # Sidebar + Header
│                   │
│                   ├── /catalog
│                   │   └── Catalog.tsx
│                   │       ├── useQuery(getRapps)
│                   │       ├── useMutation(createRapp)
│                   │       └── useMutation(primeRapp)
│                   │
│                   └── /instances
│                       └── Instances.tsx
│                           ├── useQuery(getInstances)
│                           ├── useMutation(deploy)
│                           └── useMutation(undeploy)
```

## Data Flow

### Authentication Flow
```
1. User enters token → Login.tsx
2. Token stored → AuthContext → localStorage
3. Axios interceptor adds token to all requests
4. 401 response → Clear token → Redirect to /login
```

### rApp Onboarding Flow
```
1. User clicks "+ Onboard rApp" → Catalog.tsx
2. Modal opens with form
3. User selects file + enters ID
4. useMutation(createRapp) → FormData → POST /rapps/{id}
5. Success → invalidateQueries(['rapps'])
6. TanStack Query refetches → UI updates
```

### Instance Deployment Flow
```
1. User selects rApp → Instances.tsx
2. useQuery fetches instances → GET /rapps/{id}/instance
3. User clicks "Deploy"
4. useMutation(deploy) → PUT /rapps/{id}/instance/{instanceId}
5. Success → invalidateQueries(['instances'])
6. Auto-refresh (5s) → State updates in UI
```

## State Management

### Server State (TanStack Query)
- **Query Keys**: `['rapps']`, `['instances', rappId]`
- **Caching**: Automatic with 5s stale time
- **Refetching**: Every 5 seconds (polling)
- **Mutations**: Invalidate queries on success

### Client State (React Context)
- **AuthContext**: JWT token, login/logout functions
- **Local Storage**: Persists token across sessions

### Component State (useState)
- **Form inputs**: Modal forms, file uploads
- **UI state**: Modal visibility, selected items

## API Integration

### Axios Client Configuration
```typescript
baseURL: '/rapps'
headers: { 'Content-Type': 'application/json' }

Request Interceptor:
  - Add Authorization: Bearer {token}

Response Interceptor:
  - 401 → Logout + Redirect
  - Other errors → Reject promise
```

### API Methods (rappApi.ts)
```typescript
getRapps()           → GET /rapps
getRapp(id)          → GET /rapps/{id}
createRapp(id, file) → POST /rapps/{id}
deleteRapp(id)       → DELETE /rapps/{id}
primeRapp(id, order) → PUT /rapps/{id}

getInstances(rappId) → GET /rapps/{rappId}/instance
getInstance(...)     → GET /rapps/{rappId}/instance/{instanceId}
createInstance(...)  → POST /rapps/{rappId}/instance
deployInstance(...)  → PUT /rapps/{rappId}/instance/{instanceId}
deleteInstance(...)  → DELETE /rapps/{rappId}/instance/{instanceId}
```

## Deployment Architecture

### Development
```
┌──────────────┐         ┌──────────────┐
│   Browser    │         │   Backend    │
│ localhost:   │  HTTP   │ localhost:   │
│    3000      ├────────►│    8080      │
└──────────────┘         └──────────────┘
       │
       │ Vite Dev Server
       │ (Hot reload)
       │
┌──────▼──────┐
│   Source    │
│    Files    │
└─────────────┘
```

### Production (Docker)
```
┌──────────────┐
│   Browser    │
│ localhost:   │
│    3000      │
└──────┬───────┘
       │
       │ HTTP
       │
┌──────▼───────────────────────┐
│  Nginx Container (Port 80)   │
│  ┌────────────────────────┐  │
│  │  Static Files (dist/)  │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  Proxy /rapps → :8080  │  │
│  └────────────────────────┘  │
└──────┬───────────────────────┘
       │
       │ Docker Network
       │
┌──────▼───────────────────────┐
│  Backend Container (:8080)   │
└──────────────────────────────┘
```

## Security Architecture

### Authentication
```
┌─────────────┐
│   Browser   │
│ localStorage│  ← JWT Token stored
└──────┬──────┘
       │
       │ Every request
       │
┌──────▼──────────────────┐
│  Axios Interceptor      │
│  Add: Authorization:    │
│       Bearer {token}    │
└──────┬──────────────────┘
       │
       │
┌──────▼──────────────────┐
│  Backend Validates JWT  │
└─────────────────────────┘
```

### Protected Routes
```
Route Request
     │
     ▼
ProtectedRoute Component
     │
     ├─ Has token? ─ Yes ─► Render page
     │
     └─ No token? ─────────► Redirect to /login
```

## Performance Optimizations

1. **Code Splitting**: Routes can be lazy loaded
2. **Caching**: TanStack Query caches API responses
3. **Polling**: Only active queries refresh
4. **Memoization**: React components can use useMemo/useCallback
5. **Production Build**: Vite minifies and tree-shakes

## Error Handling

```
API Error
    │
    ▼
Axios Interceptor
    │
    ├─ 401 ─────► Logout + Redirect
    │
    ├─ 4xx/5xx ─► Reject Promise
    │
    ▼
TanStack Query
    │
    ├─ Retry (1 time)
    │
    ├─ Set error state
    │
    ▼
Component
    │
    └─ Display error message
```

## Build Process

### Development
```
npm run dev
    │
    ▼
Vite Dev Server
    │
    ├─ TypeScript compilation
    ├─ Hot Module Replacement
    ├─ Proxy /rapps → :8080
    │
    ▼
Browser (localhost:3000)
```

### Production
```
npm run build
    │
    ▼
TypeScript Compiler (tsc)
    │
    ▼
Vite Build
    │
    ├─ Bundle JavaScript
    ├─ Minify code
    ├─ Tree shake unused code
    ├─ Generate source maps
    │
    ▼
dist/ folder
    │
    ▼
Docker Build
    │
    ├─ Multi-stage build
    ├─ Node image for build
    ├─ Nginx image for serve
    │
    ▼
Docker Image
```

## Scalability Considerations

1. **Horizontal Scaling**: Nginx can be load balanced
2. **CDN**: Static assets can be served from CDN
3. **API Gateway**: Can add between UI and backend
4. **Caching**: Redis can cache API responses
5. **WebSocket**: Can replace polling for real-time updates

## Future Architecture Enhancements

1. **Micro-frontends**: Split into smaller apps
2. **Server-Side Rendering**: Next.js for SEO
3. **Progressive Web App**: Offline support
4. **GraphQL**: Replace REST API
5. **State Management**: Add Redux if complexity grows

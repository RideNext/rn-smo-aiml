import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Catalog } from './pages/Catalog';
import { Topology } from './pages/Topology';
import { Deployments } from './pages/Deployments';
import { Monitoring } from './pages/Monitoring';
import { Settings } from './pages/Settings';
import { Instances } from './pages/Instances';
import { ApiManagement } from './pages/ApiManagement';
import { AiModelManagement } from './pages/AiModelManagement';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 5000,
      retry: 1,
      staleTime: 3000,
    }
  }
});

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
};

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="topology" element={<Topology />} />
              <Route path="deployments" element={<Deployments />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="api-management" element={<ApiManagement />} />
              <Route path="ai-models" element={<AiModelManagement />} />
              <Route path="settings" element={<Settings />} />
              <Route path="instances" element={<Instances />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

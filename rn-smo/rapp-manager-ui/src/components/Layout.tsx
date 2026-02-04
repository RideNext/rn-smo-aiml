import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiBox, FiLayers, FiSettings, FiLogOut, FiPackage, FiActivity, FiSun, FiMoon, FiServer, FiCpu } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: FiGrid },
  { name: 'rApp Catalog', to: '/catalog', icon: FiPackage },
  { name: 'Topology', to: '/topology', icon: FiLayers },
  { name: 'Deployments', to: '/deployments', icon: FiBox },
  { name: 'Monitoring', to: '/monitoring', icon: FiActivity },
  { name: 'API Management', to: '/api-management', icon: FiServer },
  { name: 'AI Models', to: '/ai-models', icon: FiCpu },
  { name: 'Settings', to: '/settings', icon: FiSettings },
];

export const Layout = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-lighter border-r border-dark-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">RIC Management</h1>
              <p className="text-xs text-gray-400">rApp Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-400 hover:bg-dark-card hover:text-gray-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`} />
                  <span className="font-medium">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Admin</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Administrator</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-dark-card rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-dark-card rounded-lg transition-colors text-gray-400 hover:text-gray-200"
                title="Logout"
              >
                <FiLogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <Outlet />
      </main>
    </div>
  );
};

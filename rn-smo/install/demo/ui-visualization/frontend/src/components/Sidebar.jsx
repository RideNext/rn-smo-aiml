import React from 'react';
import { LayoutDashboard, Network, Bell, Settings, Zap, Database, FileText, Leaf } from 'lucide-react';

const Sidebar = ({ currentView, onViewChange }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-logo">
                <Leaf size={28} color="var(--accent-green)" style={{ filter: 'drop-shadow(0 0 8px var(--accent-green))' }} />
                <span style={{ background: 'linear-gradient(90deg, var(--accent-green), var(--accent-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ES-RAPP</span>
            </div>

            <nav className="sidebar-nav">
                <a href="#" className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => onViewChange('dashboard')}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </a>
                <a href="#" className={`nav-item ${currentView === 'topology' ? 'active' : ''}`} onClick={() => onViewChange('topology')}>
                    <Network size={20} />
                    <span>Topology</span>
                </a>
                <a href="#" className={`nav-item ${currentView === 'dme' ? 'active' : ''}`} onClick={() => onViewChange('dme')}>
                    <Database size={20} />
                    <span>DME (ICS)</span>
                </a>
                <a href="#" className={`nav-item ${currentView === 'policy' ? 'active' : ''}`} onClick={() => onViewChange('policy')}>
                    <FileText size={20} />
                    <span>Policy</span>
                </a>
                <a href="#" className={`nav-item ${currentView === 'alerts' ? 'active' : ''}`} onClick={() => onViewChange('alerts')}>
                    <Bell size={20} />
                    <span>Alerts</span>
                </a>
                <a href="#" className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => onViewChange('settings')}>
                    <Settings size={20} />
                    <span>Settings</span>
                </a>
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile">
                    <div className="avatar" style={{ background: 'var(--accent-green)', color: '#000' }}>ES</div>
                    <div className="user-info">
                        <div className="user-name">Admin User</div>
                        <div className="user-role">Network Operator</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

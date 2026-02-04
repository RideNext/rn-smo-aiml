import { useQuery } from '@tanstack/react-query';
import { FiBox, FiCheckCircle, FiAlertCircle, FiClock, FiTrendingUp, FiPackage, FiActivity } from 'react-icons/fi';
import { rappApi } from '../api/rappApi';
import { Rapp } from '../types';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ElementType;
    trend?: string;
    trendUp?: boolean;
    color: string;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }: StatCardProps) => (
    <div className="card-hover group">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-gray-400 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
                {trend && (
                    <div className={`flex items-center space-x-1 text-sm ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                        <FiTrendingUp className={`w-4 h-4 ${!trendUp && 'rotate-180'}`} />
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className={`p-4 rounded-xl ${color} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

interface ActivityItem {
    id: string;
    type: 'deploy' | 'prime' | 'delete' | 'update';
    message: string;
    timestamp: Date;
    status: 'success' | 'error' | 'pending';
}

const ActivityFeed = ({ activities }: { activities: ActivityItem[] }) => (
    <div className="card h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiActivity className="w-5 h-5 mr-2" />
            Recent Activity
        </h3>
        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
            {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
                activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-dark-lighter rounded-lg transition-colors">
                        <div className={`mt-1 p-1.5 rounded-full ${activity.status === 'success' ? 'bg-green-500/20 text-green-400' :
                                activity.status === 'error' ? 'bg-red-500/20 text-red-400' :
                                    'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {activity.status === 'success' && <FiCheckCircle className="w-4 h-4" />}
                            {activity.status === 'error' && <FiAlertCircle className="w-4 h-4" />}
                            {activity.status === 'pending' && <FiClock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.timestamp).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

export const Dashboard = () => {
    const { data: rapps, isLoading } = useQuery<Rapp[]>({
        queryKey: ['rapps'],
        queryFn: async () => (await rappApi.getRapps()).data,
    });

    // Calculate statistics
    const stats = {
        total: rapps?.length || 0,
        deployed: rapps?.filter(r => r.state === 'DEPLOYED').length || 0,
        primed: rapps?.filter(r => r.state === 'PRIMED').length || 0,
        commissioned: rapps?.filter(r => r.state === 'COMMISSIONED').length || 0,
    };

    // Mock activity data (replace with real data from backend)
    const mockActivities: ActivityItem[] = rapps?.slice(0, 10).map((rapp, idx) => ({
        id: rapp.rappId,
        type: 'deploy',
        message: `rApp "${rapp.name}" ${rapp.state.toLowerCase()}`,
        timestamp: new Date(Date.now() - idx * 3600000),
        status: rapp.state === 'DEPLOYED' ? 'success' : rapp.state === 'COMMISSIONED' ? 'pending' : 'error',
    })) || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-gray-400">Overview of your rApp platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total rApps"
                    value={stats.total}
                    icon={FiPackage}
                    trend="+12% from last month"
                    trendUp={true}
                    color="bg-gradient-to-br from-blue-500 to-blue-700"
                />
                <StatCard
                    title="Deployed"
                    value={stats.deployed}
                    icon={FiCheckCircle}
                    trend="+5.2%"
                    trendUp={true}
                    color="bg-gradient-to-br from-green-500 to-green-700"
                />
                <StatCard
                    title="Primed"
                    value={stats.primed}
                    icon={FiBox}
                    color="bg-gradient-to-br from-yellow-500 to-yellow-700"
                />
                <StatCard
                    title="Available"
                    value={stats.commissioned}
                    icon={FiClock}
                    color="bg-gradient-to-br from-purple-500 to-purple-700"
                />
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* rApp Distribution */}
                <div className="card lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">rApp Distribution by State</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Deployed', count: stats.deployed, color: 'bg-green-500', total: stats.total },
                            { label: 'Primed', count: stats.primed, color: 'bg-yellow-500', total: stats.total },
                            { label: 'Commissioned', count: stats.commissioned, color: 'bg-blue-500', total: stats.total },
                        ].map((item) => {
                            const percentage = stats.total > 0 ? (item.count / item.total * 100).toFixed(1) : 0;
                            return (
                                <div key={item.label}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-300">{item.label}</span>
                                        <span className="text-sm text-gray-400">{item.count} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-dark-lighter rounded-full h-2">
                                        <div
                                            className={`${item.color} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <button className="w-full btn-primary text-left flex items-center justify-between">
                            <span>Upload rApp</span>
                            <FiPackage className="w-5 h-5" />
                        </button>
                        <button className="w-full btn-secondary text-left flex items-center justify-between">
                            <span>View Catalog</span>
                            <FiBox className="w-5 h-5" />
                        </button>
                        <button className="w-full btn-secondary text-left flex items-center justify-between">
                            <span>Monitor Deployments</span>
                            <FiActivity className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <ActivityFeed activities={mockActivities} />
        </div>
    );
};

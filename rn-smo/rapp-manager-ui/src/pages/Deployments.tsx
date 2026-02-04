import { useQuery } from '@tanstack/react-query';
import { FiBox, FiActivity, FiCheckCircle, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { rappApi } from '../api/rappApi';
import { Rapp } from '../types';

export const Deployments = () => {
    const { data: rapps, isLoading } = useQuery<Rapp[]>({
        queryKey: ['rapps'],
        queryFn: async () => (await rappApi.getRapps()).data,
    });

    // Get all instances from all rapps
    const allInstances = rapps?.flatMap(rapp =>
        Object.values(rapp.rappInstances || {}).map((instance: any) => ({
            ...instance,
            rappName: rapp.name,
            rappId: rapp.rappId,
        }))
    ) || [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                    <FiBox className="w-8 h-8 mr-3" />
                    Deployments
                </h1>
                <p className="text-gray-400">Monitor and manage rApp instances</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Instances</p>
                            <p className="text-2xl font-bold text-white mt-1">{allInstances.length}</p>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-lg">
                            <FiBox className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Running</p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {allInstances.filter(i => i.state === 'DEPLOYED').length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <FiCheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Pending</p>
                            <p className="text-2xl font-bold text-white mt-1">
                                {allInstances.filter(i => i.state === 'DEPLOYING').length}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                            <FiClock className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Issues</p>
                            <p className="text-2xl font-bold text-white mt-1">0</p>
                        </div>
                        <div className="p-3 bg-red-500/20 rounded-lg">
                            <FiAlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Instances List */}
            <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">Active Instances</h2>
                <div className="space-y-3">
                    {allInstances.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No instances deployed</p>
                    ) : (
                        allInstances.map((instance: any) => (
                            <div key={instance.rappInstanceId} className="p-4 bg-dark-lighter rounded-lg hover:bg-dark-border transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-primary-500/20 rounded-lg">
                                            <FiActivity className="w-5 h-5 text-primary-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-white">{instance.rappName}</h3>
                                            <p className="text-sm text-gray-400 font-mono">{instance.rappInstanceId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`badge ${instance.state === 'DEPLOYED' ? 'badge-success' :
                                                instance.state === 'DEPLOYING' ? 'badge-warning' :
                                                    'badge-secondary'
                                            }`}>
                                            {instance.state}
                                        </span>
                                        <button className="btn-ghost px-3 py-1 text-sm">Manage</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

import { useState } from 'react';
import { EnhancedRapp, LifecycleAction } from '../types';
import { RappAdapter } from '../adapters';
import { FiPlay, FiSquare, FiRefreshCw, FiUpload, FiDownload, FiTrash2, FiAlertCircle } from 'react-icons/fi';

interface StateAwareActionsProps {
    rapp: EnhancedRapp;
    onAction: (action: LifecycleAction) => void;
    variant?: 'buttons' | 'dropdown';
}

/**
 * StateAwareActions - Smart action buttons that only show valid actions
 * 
 * Features:
 * - Only shows actions available for current state
 * - Disables invalid actions with explanatory tooltips
 * - Shows governance validation warnings
 * - Confirmation dialogs for destructive actions
 */
export const StateAwareActions = ({
    rapp,
    onAction,
    variant = 'buttons',
}: StateAwareActionsProps) => {
    const [showConfirm, setShowConfirm] = useState<LifecycleAction | null>(null);
    const adapter = new RappAdapter();

    const actionConfig: Record<LifecycleAction, {
        label: string;
        icon: JSX.Element;
        color: string;
        destructive: boolean;
    }> = {
        deploy: {
            label: 'Deploy',
            icon: <FiPlay />,
            color: '#10b981',
            destructive: false,
        },
        start: {
            label: 'Start',
            icon: <FiPlay />,
            color: '#10b981',
            destructive: false,
        },
        stop: {
            label: 'Stop',
            icon: <FiSquare />,
            color: '#f59e0b',
            destructive: false,
        },
        restart: {
            label: 'Restart',
            icon: <FiRefreshCw />,
            color: '#3b82f6',
            destructive: false,
        },
        upgrade: {
            label: 'Upgrade',
            icon: <FiUpload />,
            color: '#8b5cf6',
            destructive: false,
        },
        rollback: {
            label: 'Rollback',
            icon: <FiDownload />,
            color: '#f59e0b',
            destructive: true,
        },
        uninstall: {
            label: 'Uninstall',
            icon: <FiTrash2 />,
            color: '#ef4444',
            destructive: true,
        },
    };

    const handleAction = (action: LifecycleAction) => {
        const config = actionConfig[action];

        if (config.destructive) {
            setShowConfirm(action);
        } else {
            onAction(action);
        }
    };

    const confirmAction = () => {
        if (showConfirm) {
            onAction(showConfirm);
            setShowConfirm(null);
        }
    };

    if (variant === 'dropdown') {
        return (
            <>
                <ActionDropdown
                    rapp={rapp}
                    availableActions={rapp.availableActions}
                    actionConfig={actionConfig}
                    onAction={handleAction}
                    adapter={adapter}
                />
                {showConfirm && (
                    <ConfirmDialog
                        action={showConfirm}
                        actionConfig={actionConfig}
                        onConfirm={confirmAction}
                        onCancel={() => setShowConfirm(null)}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
                {rapp.availableActions.map(action => {
                    const config = actionConfig[action];

                    return (
                        <button
                            key={action}
                            onClick={() => handleAction(action)}
                            className="btn-primary flex items-center space-x-2"
                            style={{ backgroundColor: config.color }}
                        >
                            {config.icon}
                            <span>{config.label}</span>
                        </button>
                    );
                })}

                {/* Show blocked actions with tooltips */}
                {Object.keys(actionConfig)
                    .filter(a => !rapp.availableActions.includes(a as LifecycleAction))
                    .slice(0, 2) // Show max 2 blocked actions
                    .map(action => {
                        const config = actionConfig[action as LifecycleAction];
                        const reason = adapter.getBlockedReason(rapp, action as LifecycleAction);

                        return (
                            <div key={action} className="relative group">
                                <button
                                    className="btn-secondary opacity-50 cursor-not-allowed flex items-center space-x-2"
                                    disabled
                                >
                                    {config.icon}
                                    <span>{config.label}</span>
                                </button>
                                {reason && (
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                                        <div className="bg-dark-card border border-yellow-500 rounded-lg p-3 shadow-lg max-w-xs">
                                            <div className="flex items-start space-x-2">
                                                <FiAlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                                    {reason}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {showConfirm && (
                <ConfirmDialog
                    action={showConfirm}
                    actionConfig={actionConfig}
                    onConfirm={confirmAction}
                    onCancel={() => setShowConfirm(null)}
                />
            )}
        </>
    );
};

/**
 * Action Dropdown (for compact display)
 */
const ActionDropdown = ({
    rapp,
    availableActions,
    actionConfig,
    onAction,
    adapter,
}: any) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn-primary flex items-center space-x-2"
            >
                <span>Actions</span>
                <span className="text-xs">▼</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-dark-card border rounded-lg shadow-lg z-20" style={{ borderColor: 'var(--border-color)' }}>
                        {availableActions.map((action: LifecycleAction) => {
                            const config = actionConfig[action];
                            return (
                                <button
                                    key={action}
                                    onClick={() => {
                                        onAction(action);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-dark-lighter transition-colors"
                                >
                                    <span style={{ color: config.color }}>{config.icon}</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{config.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

/**
 * Confirmation Dialog
 */
const ConfirmDialog = ({
    action,
    actionConfig,
    onConfirm,
    onCancel,
}: {
    action: LifecycleAction;
    actionConfig: any;
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    const config = actionConfig[action];

    return (
        <div className="modal-backdrop animate-fade-in" onClick={onCancel}>
            <div className="modal-content animate-scale-in max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start space-x-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-500/20">
                        <FiAlertCircle className="text-red-500 text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Confirm {config.label}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                    <button onClick={onCancel} className="btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-primary"
                        style={{ backgroundColor: config.color }}
                    >
                        {config.label}
                    </button>
                </div>
            </div>
        </div>
    );
};

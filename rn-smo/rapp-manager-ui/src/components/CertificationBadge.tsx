import { CertificationStatus } from '../types';
import { CertificationAdapter } from '../adapters';
import { FiInfo } from 'react-icons/fi';
import { useState } from 'react';

interface CertificationBadgeProps {
    certification: CertificationStatus;
    size?: 'small' | 'medium' | 'large';
    showDetails?: boolean;
}

/**
 * CertificationBadge - Visual badge showing certification status
 * 
 * Displays certification level with icon, color, and optional details modal
 */
export const CertificationBadge = ({
    certification,
    size = 'medium',
    showDetails = true,
}: CertificationBadgeProps) => {
    const [showModal, setShowModal] = useState(false);

    const sizeClasses = {
        small: 'text-xs px-2 py-1',
        medium: 'text-sm px-3 py-1.5',
        large: 'text-base px-4 py-2',
    };

    const iconSizes = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base',
    };

    const label = CertificationAdapter.getLabel(certification.level);
    const color = CertificationAdapter.getColor(certification.level);

    return (
        <>
            <div
                className={`inline-flex items-center space-x-1.5 rounded-full font-medium cursor-pointer transition-all hover:scale-105 ${sizeClasses[size]}`}
                style={{
                    backgroundColor: `${color}20`,
                    color: color,
                    border: `1px solid ${color}40`,
                }}
                onClick={() => showDetails && setShowModal(true)}
                title={showDetails ? 'Click for details' : label}
            >
                <span className={iconSizes[size]}>{certification.badge}</span>
                <span>{label}</span>
                {showDetails && <FiInfo className={`${iconSizes[size]} opacity-70`} />}
            </div>

            {/* Details Modal */}
            {showModal && showDetails && (
                <div className="modal-backdrop animate-fade-in" onClick={() => setShowModal(false)}>
                    <div className="modal-content animate-scale-in max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <span className="text-3xl">{certification.badge}</span>
                                <div>
                                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {label}
                                    </h2>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                        Certification Score: {certification.score}/100
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="btn-ghost p-2">
                                ✕
                            </button>
                        </div>

                        {/* Score Bar */}
                        <div className="mb-6">
                            <div className="h-3 bg-dark-lighter rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        width: `${certification.score}%`,
                                        backgroundColor: color,
                                    }}
                                />
                            </div>
                        </div>

                        {/* Certification Checks */}
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                Certification Checks
                            </h3>
                            {certification.checks.map((check, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start space-x-3 p-4 rounded-lg"
                                    style={{ backgroundColor: 'var(--bg-card)' }}
                                >
                                    <div className="flex-shrink-0 mt-0.5">
                                        {check.passed ? (
                                            <span className="text-green-500 text-xl">✓</span>
                                        ) : (
                                            <span className="text-red-500 text-xl">✗</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                {check.name}
                                            </h4>
                                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                Weight: {check.weight}%
                                            </span>
                                        </div>
                                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                                            {check.description}
                                        </p>
                                        {check.details && (
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                                {check.details}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                                Last updated: {new Date(certification.lastUpdated).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

/**
 * Compact certification indicator (just icon)
 */
export const CertificationIcon = ({ certification }: { certification: CertificationStatus }) => {
    const color = CertificationAdapter.getColor(certification.level);
    const label = CertificationAdapter.getLabel(certification.level);

    return (
        <span
            className="inline-block text-lg"
            style={{ color }}
            title={`${label} (${certification.score}/100)`}
        >
            {certification.badge}
        </span>
    );
};

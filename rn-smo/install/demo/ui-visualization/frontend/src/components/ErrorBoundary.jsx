import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.state = { hasError: true, error, errorInfo };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="glass-card" style={{
                    padding: '3rem',
                    textAlign: 'center',
                    margin: '2rem'
                }}>
                    <AlertCircle
                        size={64}
                        style={{
                            color: 'var(--accent-red)',
                            marginBottom: '1.5rem'
                        }}
                    />
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '1rem'
                    }}>
                        Something went wrong
                    </h2>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '2rem',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        We encountered an error while rendering this component.
                        The application has been notified and the issue will be resolved.
                    </p>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{
                            marginTop: '2rem',
                            textAlign: 'left',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            <summary style={{
                                cursor: 'pointer',
                                fontWeight: 600,
                                color: 'var(--accent-red)',
                                marginBottom: '0.5rem'
                            }}>
                                Error Details (Development Only)
                            </summary>
                            <pre style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)',
                                overflow: 'auto',
                                maxHeight: '300px'
                            }}>
                                {this.state.error.toString()}
                                {'\n\n'}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '2rem',
                            padding: '0.75rem 1.5rem',
                            background: 'var(--accent-blue)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px var(--accent-blue-glow)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

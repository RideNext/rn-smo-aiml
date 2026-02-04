import React, { useState, useEffect } from 'react';
import { Server, Users, RefreshCw, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';

const DmeView = () => {
  const [producers, setProducers] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('producers');
  const [expandedItems, setExpandedItems] = useState({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [producersRes, consumersRes] = await Promise.all([
        fetch('/api/ics/producers'),
        fetch('/api/ics/consumers')
      ]);

      if (!producersRes.ok || !consumersRes.ok) {
        throw new Error('Failed to fetch ICS data');
      }

      const producersData = await producersRes.json();
      const consumersData = await consumersRes.json();

      setProducers(producersData);
      setConsumers(consumersData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const tabStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    background: isActive ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
    border: 'none',
    borderRadius: '0.5rem 0.5rem 0 0',
    color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.3s ease',
    position: 'relative'
  });

  if (loading && producers.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={48} style={{ color: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
        <div className="card-title" style={{ marginTop: '1rem' }}>Loading DME Data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div className="card-title" style={{ color: 'var(--accent-red)' }}>Error</div>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <button onClick={fetchData} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  const InfoRow = ({ label, value, mono = false }) => (
    value ? (
      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
          {label}:
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          wordBreak: 'break-all',
          fontFamily: mono ? 'monospace' : 'inherit',
          background: mono ? 'rgba(0,0,0,0.2)' : 'transparent',
          padding: mono ? '0.5rem' : '0',
          borderRadius: mono ? '0.25rem' : '0'
        }}>
          {value}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
      {/* Tab Header */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '1rem 2rem 0 2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setActiveTab('producers')} style={tabStyle(activeTab === 'producers')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server size={18} />
                <span>Producers ({producers.length})</span>
              </div>
            </button>
            <button type="button" onClick={() => setActiveTab('consumers')} style={tabStyle(activeTab === 'consumers')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={18} />
                <span>Consumers ({consumers.length})</span>
              </div>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingBottom: '0.5rem' }}>
            <button type="button" onClick={fetchData} style={{
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '2rem' }}>
        {activeTab === 'producers' && (
          <div>
            {producers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No producers registered
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {producers.map((producer) => {
                  const isExpanded = expandedItems[producer.info_producer_id];
                  return (
                    <div key={producer.info_producer_id} className="glass-card" style={{
                      padding: '0',
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderColor: 'rgba(59, 130, 246, 0.2)',
                      overflow: 'hidden'
                    }}>
                      {/* Header - Always Visible */}
                      <div
                        onClick={() => toggleExpanded(producer.info_producer_id)}
                        style={{
                          padding: '1.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.2s',
                          background: isExpanded ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--accent-blue)' }}>
                              {producer.info_producer_id}
                            </div>
                            <div className="status-badge green" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />
                              Active
                            </div>
                          </div>
                          {producer.supported_info_types && producer.supported_info_types.length > 0 && (
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                              <strong>Types:</strong> {producer.supported_info_types.join(', ')}
                            </div>
                          )}
                        </div>
                        <div style={{
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--accent-blue)',
                          transition: 'transform 0.3s'
                        }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div style={{
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          borderTop: '1px solid rgba(59, 130, 246, 0.1)',
                          background: 'rgba(0, 0, 0, 0.1)'
                        }}>
                          <div style={{ marginTop: '1rem' }}>
                            <InfoRow label="Status Callback URL" value={producer.status_callback_url} mono />
                            <InfoRow label="Job Callback URL" value={producer.job_callback_url} mono />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consumers' && (
          <div>
            {consumers.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No consumers registered
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {consumers.map((consumer) => {
                  const isExpanded = expandedItems[consumer.info_job_identity];
                  return (
                    <div key={consumer.info_job_identity} className="glass-card" style={{
                      padding: '0',
                      background: 'rgba(168, 85, 247, 0.05)',
                      borderColor: 'rgba(168, 85, 247, 0.2)',
                      overflow: 'hidden'
                    }}>
                      {/* Header - Always Visible */}
                      <div
                        onClick={() => toggleExpanded(consumer.info_job_identity)}
                        style={{
                          padding: '1.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.2s',
                          background: isExpanded ? 'rgba(168, 85, 247, 0.08)' : 'transparent'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--accent-purple)' }}>
                              {consumer.info_job_identity}
                            </div>
                            <div className="status-badge green" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />
                              Active
                            </div>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {consumer.info_type_identity && (
                              <>
                                <strong>Type:</strong> {consumer.info_type_identity}
                              </>
                            )}
                            {consumer.owner && (
                              <>
                                {consumer.info_type_identity && ' • '}
                                <strong>Owner:</strong> {consumer.owner}
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(168, 85, 247, 0.1)',
                          color: 'var(--accent-purple)',
                          transition: 'transform 0.3s'
                        }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div style={{
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          borderTop: '1px solid rgba(168, 85, 247, 0.1)',
                          background: 'rgba(0, 0, 0, 0.1)'
                        }}>
                          <div style={{ marginTop: '1rem' }}>
                            <InfoRow label="Target URI" value={consumer.target_uri} mono />

                            {consumer.job_definition && (
                              <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '500',
                                  color: 'var(--text-primary)',
                                  marginBottom: '0.5rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <Info size={16} />
                                  Job Configuration:
                                </div>
                                <div style={{
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  borderRadius: '0.5rem',
                                  padding: '1rem',
                                  border: '1px solid rgba(168, 85, 247, 0.2)'
                                }}>
                                  <pre style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    margin: 0,
                                    overflow: 'auto',
                                    maxHeight: '300px',
                                    fontFamily: 'monospace'
                                  }}>
                                    {JSON.stringify(consumer.job_definition, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DmeView;

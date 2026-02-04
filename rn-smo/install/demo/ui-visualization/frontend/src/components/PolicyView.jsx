import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Plus, Trash2, X, Server, ChevronDown, ChevronUp, Info, CheckCircle } from 'lucide-react';
import CreatePolicyPanel from './CreatePolicyPanel';

const PolicyView = () => {
  const [activeTab, setActiveTab] = useState('rics');
  const [rics, setRics] = useState([]);
  const [policyTypes, setPolicyTypes] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [ricsRes, typesRes, policiesRes] = await Promise.all([
        fetch('/api/policy/rics'),
        fetch('/api/policy/types'),
        fetch('/api/policy/policies')
      ]);

      if (ricsRes.ok) setRics(await ricsRes.json());
      if (typesRes.ok) setPolicyTypes(await typesRes.json());
      if (policiesRes.ok) setPolicies(await policiesRes.json());
    } catch (err) {
      console.error('Error fetching policy data:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const handleCreatePolicy = async (policyData) => {
    try {
      const response = await fetch('/api/policy/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyData)
      });

      const result = await response.json();

      if (response.ok) {
        setShowCreatePanel(false);
        fetchData();

        // Show success message
        alert(
          `✅ Policy Created Successfully!\n\n` +
          `Policy ID: ${policyData.policyId}\n` +
          `Policy Type: ${policyData.policyTypeId}\n` +
          `Target RIC: ${policyData.ric}\n\n` +
          `The policy has been successfully pushed to the Near RT RIC via A1 Policy Management Service.`
        );
      } else {
        // Show detailed error message
        const errorMsg = result.message || result.detail || 'Unknown error occurred';
        alert(
          `❌ Failed to Create Policy\n\n` +
          `Error: ${errorMsg}\n\n` +
          `Please check your configuration and try again.`
        );
      }
    } catch (err) {
      alert(
        `❌ Error Creating Policy\n\n` +
        `Network Error: ${err.message}\n\n` +
        `Please check your connection and ensure the backend service is running.`
      );
    }
  };

  const deletePolicy = async (policyId) => {
    if (confirm('Delete policy ' + policyId + '?')) {
      try {
        const response = await fetch(`/api/policy/policies/${policyId}`, { method: 'DELETE' });
        if (response.ok) fetchData();
      } catch (err) {
        console.error('Error deleting policy:', err);
      }
    }
  };

  useEffect(() => {
    fetchData(true);

    // Only poll if the create panel is NOT open
    let interval;
    if (!showCreatePanel) {
      interval = setInterval(() => fetchData(false), 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showCreatePanel]); // Re-run effect when showCreatePanel changes

  const toggleExpanded = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading && rics.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={48} style={{ color: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
        <div className="card-title" style={{ marginTop: '1rem' }}>Loading Policy Data...</div>
      </div>
    );
  }

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
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '1rem 2rem 0 2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setActiveTab('rics')} style={tabStyle(activeTab === 'rics')}>
              RIC Details
            </button>
            <button type="button" onClick={() => setActiveTab('types')} style={tabStyle(activeTab === 'types')}>
              Policy Types
            </button>
            <button type="button" onClick={() => setActiveTab('policies')} style={tabStyle(activeTab === 'policies')}>
              Policies
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingBottom: '0.5rem' }}>
            {activeTab === 'policies' && (
              <button type="button" onClick={() => setShowCreatePanel(true)} style={{ padding: '0.5rem 1rem', background: 'var(--accent-blue)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                <Plus size={16} /> Create
              </button>
            )}
            <button type="button" onClick={() => fetchData(true)} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {activeTab === 'rics' && (
          <div>
            <div className="card-title" style={{ marginBottom: '1rem' }}>RIC Details ({rics.length})</div>
            {rics.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No RICs registered</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {rics.map((ric, index) => {
                  const ricId = ric.ric_id || `RIC ${index + 1}`;
                  const isExpanded = expandedItems[ricId];
                  return (
                    <div key={ricId} className="glass-card" style={{
                      padding: '0',
                      background: 'rgba(59, 130, 246, 0.05)',
                      borderColor: 'rgba(59, 130, 246, 0.2)',
                      overflow: 'hidden'
                    }}>
                      <div
                        onClick={() => toggleExpanded(ricId)}
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
                              {ricId}
                            </div>
                            <div className="status-badge green" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />
                              Active
                            </div>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {ric.managed_element_ids && (
                              <span><strong>Managed Elements:</strong> {ric.managed_element_ids.length}</span>
                            )}
                            {ric.policy_type_ids && (
                              <span style={{ marginLeft: '1rem' }}><strong>Policy Types:</strong> {ric.policy_type_ids.length}</span>
                            )}
                          </div>
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

                      {isExpanded && (
                        <div style={{
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          borderTop: '1px solid rgba(59, 130, 246, 0.1)',
                          background: 'rgba(0, 0, 0, 0.1)'
                        }}>
                          <div style={{ marginTop: '1rem' }}>
                            {ric.managed_element_ids && ric.managed_element_ids.length > 0 && (
                              <InfoRow label="Managed Elements" value={ric.managed_element_ids.join(', ')} />
                            )}
                            {ric.policy_type_ids && ric.policy_type_ids.length > 0 && (
                              <InfoRow label="Supported Policy Types" value={ric.policy_type_ids.join(', ')} />
                            )}
                            <InfoRow label="State" value={ric.state || 'AVAILABLE'} />
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

        {activeTab === 'types' && (
          <div>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Policy Types ({policyTypes.length})</div>
            {policyTypes.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No policy types available</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {policyTypes.map((type, index) => {
                  const typeId = type.policy_type_id || type.policytype_id;
                  const isExpanded = expandedItems[typeId];
                  return (
                    <div key={typeId} className="glass-card" style={{
                      padding: '0',
                      background: 'rgba(6, 182, 212, 0.05)',
                      borderColor: 'rgba(6, 182, 212, 0.2)',
                      overflow: 'hidden'
                    }}>
                      <div
                        onClick={() => toggleExpanded(typeId)}
                        style={{
                          padding: '1.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.2s',
                          background: isExpanded ? 'rgba(6, 182, 212, 0.08)' : 'transparent'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>
                              {typeId}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {type.schema ? 'Schema Definition Available' : 'No Schema Definition'}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.5rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(6, 182, 212, 0.1)',
                          color: 'var(--accent-cyan)',
                          transition: 'transform 0.3s'
                        }}>
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {isExpanded && type.policy_schema && (
                        <div style={{
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          borderTop: '1px solid rgba(6, 182, 212, 0.1)',
                          background: 'rgba(0, 0, 0, 0.1)'
                        }}>
                          <div style={{ marginTop: '1rem' }}>
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
                              Schema Definition:
                            </div>
                            <div style={{
                              background: 'rgba(0, 0, 0, 0.3)',
                              borderRadius: '0.5rem',
                              padding: '1rem',
                              border: '1px solid rgba(6, 182, 212, 0.2)'
                            }}>
                              <pre style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                margin: 0,
                                overflow: 'auto',
                                maxHeight: '300px',
                                fontFamily: 'monospace'
                              }}>
                                {JSON.stringify(type.policy_schema, null, 2)}
                              </pre>
                            </div>
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

        {activeTab === 'policies' && (
          <div>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Policies ({policies.length})</div>
            {policies.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No policies configured</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {policies.map((policy) => {
                  const isExpanded = expandedItems[policy.policy_id];
                  return (
                    <div key={policy.policy_id} className="glass-card" style={{
                      padding: '0',
                      background: 'rgba(168, 85, 247, 0.05)',
                      borderColor: 'rgba(168, 85, 247, 0.2)',
                      overflow: 'hidden'
                    }}>
                      <div
                        onClick={() => toggleExpanded(policy.policy_id)}
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
                              {policy.policy_id}
                            </div>
                            <div className="status-badge green" style={{ fontSize: '0.75rem' }}>
                              <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />
                              Active
                            </div>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {policy.ric_id && (
                              <><strong>RIC:</strong> {policy.ric_id}</>
                            )}
                            {policy.policytype_id && (
                              <><span style={{ margin: '0 0.5rem' }}>•</span><strong>Type:</strong> {policy.policytype_id}</>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePolicy(policy.policy_id); }}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '0.5rem',
                              padding: '0.5rem',
                              cursor: 'pointer',
                              color: 'var(--accent-red)',
                              marginRight: '0.5rem'
                            }}
                            title="Delete Policy"
                          >
                            <Trash2 size={18} />
                          </button>
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
                      </div>

                      {isExpanded && (
                        <div style={{
                          padding: '0 1.5rem 1.5rem 1.5rem',
                          borderTop: '1px solid rgba(168, 85, 247, 0.1)',
                          background: 'rgba(0, 0, 0, 0.1)'
                        }}>
                          <div style={{ marginTop: '1rem' }}>
                            <InfoRow label="Service ID" value={policy.service_id} />

                            {policy.policy_data && (
                              <div style={{ marginTop: '1rem' }}>
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
                                  Policy Configuration:
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
                                    {JSON.stringify(policy.policy_data, null, 2)}
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

      <CreatePolicyPanel
        isOpen={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        onCreate={handleCreatePolicy}
        rics={rics}
        policyTypes={policyTypes}
      />
    </div>
  );
};

export default PolicyView;

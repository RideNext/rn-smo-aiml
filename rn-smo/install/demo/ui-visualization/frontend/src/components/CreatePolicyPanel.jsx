import React, { useState, useEffect } from 'react';
import { X, Save, FileJson, Server, Layers, Tag, Box, Check, AlertCircle } from 'lucide-react';

const CreatePolicyPanel = ({ isOpen, onClose, onCreate, rics = [], policyTypes = [] }) => {
    const [formData, setFormData] = useState({
        policyId: '',
        policyTypeId: '',
        ric: '',
        service: 'rApp-service',
        policyData: '{}'
    });

    const [compatibleRics, setCompatibleRics] = useState([]);
    const [jsonError, setJsonError] = useState(null);
    const [isValidated, setIsValidated] = useState(false);

    // Reset form ONLY when opening the panel
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                policyId: `policy-${Math.floor(Math.random() * 10000)}`,
                // Keep existing selection if valid, otherwise reset
                policyTypeId: prev.policyTypeId || '',
                ric: prev.ric || '',
                service: 'rApp-service',
                policyData: '{}' // Start with empty JSON object
            }));
            setCompatibleRics(rics);
            setJsonError(null);
            setIsValidated(false);
        }
    }, [isOpen]); // Removed 'rics' dependency to prevent reset on background updates

    // Filter RICs based on selected Policy Type
    useEffect(() => {
        if (formData.policyTypeId) {
            // Filter RICs that explicitly support this type OR have no type info (fallback)
            const filtered = rics.filter(ric => {
                if (!ric.policy_type_ids || ric.policy_type_ids.length === 0) return true; // Assume compatible if no info
                return ric.policy_type_ids.includes(formData.policyTypeId);
            });

            setCompatibleRics(filtered);

            // Clear RIC selection if it's no longer compatible
            if (formData.ric && !filtered.find(r => (r.ric_id || r.name) === formData.ric)) {
                setFormData(prev => ({ ...prev, ric: '' }));
            }
        } else {
            setCompatibleRics(rics);
        }
    }, [formData.policyTypeId, rics]);

    const validateAgainstSchema = (data, schema) => {
        if (!schema) return true; // No schema to validate against

        // 1. Check Required Fields
        if (schema.required && Array.isArray(schema.required)) {
            for (const field of schema.required) {
                if (!(field in data)) {
                    throw new Error(`Missing required field: "${field}"`);
                }
            }
        }

        // 2. Check Properties and Types
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in data) {
                    const value = data[key];
                    const type = propSchema.type;

                    // Type Checking
                    if (type === 'integer' && !Number.isInteger(value)) {
                        throw new Error(`Field "${key}" must be an integer`);
                    }
                    if (type === 'number' && typeof value !== 'number') {
                        throw new Error(`Field "${key}" must be a number`);
                    }
                    if (type === 'string' && typeof value !== 'string') {
                        throw new Error(`Field "${key}" must be a string`);
                    }
                    if (type === 'boolean' && typeof value !== 'boolean') {
                        throw new Error(`Field "${key}" must be a boolean`);
                    }
                    if (type === 'array' && !Array.isArray(value)) {
                        throw new Error(`Field "${key}" must be an array`);
                    }
                    if (type === 'object') {
                        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                            throw new Error(`Field "${key}" must be an object`);
                        }
                        // Recursive validation for nested objects
                        validateAgainstSchema(value, propSchema);
                    }
                }
            }
        }
        return true;
    };

    const validateJson = (value) => {
        try {
            const parsed = JSON.parse(value);

            // If a policy type is selected, validate against its schema
            if (formData.policyTypeId) {
                // Convert both to strings for comparison to handle number/string mismatch
                const type = policyTypes.find(t =>
                    String(t.policytype_id || t.policy_type_id) === String(formData.policyTypeId)
                );

                if (type && type.policy_schema) {
                    validateAgainstSchema(parsed, type.policy_schema);
                }
            }

            setJsonError(null);
            return true;
        } catch (e) {
            setJsonError(e.message);
            return false;
        }
    };

    const handleValidate = () => {
        const isValid = validateJson(formData.policyData);
        if (isValid) {
            setIsValidated(true);
        } else {
            setIsValidated(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'policyData') {
            setIsValidated(false); // Reset validation on change
            validateJson(value);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isValidated) return; // Prevent submit if not validated
        if (!validateJson(formData.policyData)) return;

        onCreate({
            ...formData,
            policyData: JSON.parse(formData.policyData) // Send as object
        });
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            display: 'flex',
            justifyContent: 'flex-end'
        }}>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.3s ease'
                }}
            />

            {/* Slide-over Panel */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '800px',
                background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                borderLeft: '1px solid rgba(59, 130, 246, 0.2)',
                boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
            }}>
                {/* Header - Fixed Height */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.9)',
                    flexShrink: 0,
                    zIndex: 10
                }}>
                    <div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: 'var(--accent-blue)',
                            margin: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <FileJson size={28} />
                            Create New Policy
                        </h2>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Configure and deploy a new A1 policy to the network
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.color = 'white'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.05)'; e.target.style.color = 'var(--text-secondary)'; }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    minHeight: 0
                }}>
                    <form id="create-policy-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>

                        {/* Row 1: Selection Logic */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Policy Type Selection */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                                    <Layers size={18} color="var(--accent-cyan)" />
                                    1. Select Policy Type
                                </label>
                                <select
                                    value={formData.policyTypeId}
                                    onChange={(e) => handleChange('policyTypeId', e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <option value="">Choose Type...</option>
                                    {policyTypes.map(type => (
                                        <option key={type.policytype_id || type.policy_type_id} value={type.policytype_id || type.policy_type_id}>
                                            {type.policytype_id || type.policy_type_id}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* RIC Selection */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                                    <Server size={18} color="var(--accent-purple)" />
                                    2. Select Target RIC
                                </label>
                                <select
                                    value={formData.ric}
                                    onChange={(e) => handleChange('ric', e.target.value)}
                                    required
                                    disabled={!formData.policyTypeId}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        background: formData.policyTypeId ? 'rgba(15, 23, 42, 0.6)' : 'rgba(15, 23, 42, 0.3)',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderRadius: '0.5rem',
                                        color: formData.policyTypeId ? 'white' : 'rgba(255,255,255,0.3)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        cursor: formData.policyTypeId ? 'pointer' : 'not-allowed',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <option value="">{formData.policyTypeId ? 'Choose RIC...' : 'Select Type first'}</option>
                                    {compatibleRics.map(ric => (
                                        <option key={ric.ric_id || ric.name} value={ric.ric_id || ric.name}>
                                            {ric.ric_id || ric.name}
                                        </option>
                                    ))}
                                </select>
                                {formData.policyTypeId && compatibleRics.length === 0 && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-yellow)', marginTop: '0.5rem' }}>
                                        No specific RICs found. Check simulator status.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Identifiers */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {/* Policy ID */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                                    <Tag size={18} color="var(--accent-blue)" />
                                    Policy ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.policyId}
                                    onChange={(e) => handleChange('policyId', e.target.value)}
                                    required
                                    placeholder="e.g., policy-123"
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {/* Service ID */}
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                                    <Box size={18} color="var(--text-secondary)" />
                                    Service ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.service}
                                    onChange={(e) => handleChange('service', e.target.value)}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        background: 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Row 3: Configuration Editor */}
                        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    <FileJson size={18} color="var(--accent-green)" />
                                    Policy Configuration
                                </label>
                                {formData.policyTypeId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const type = policyTypes.find(t => (t.policytype_id || t.policy_type_id) === formData.policyTypeId);
                                            if (type && type.policy_schema) {
                                                const schema = type.policy_schema;
                                                const template = {};
                                                if (schema.properties) {
                                                    Object.keys(schema.properties).forEach(key => {
                                                        const prop = schema.properties[key];
                                                        template[key] = prop.type === 'integer' || prop.type === 'number' ? 0 :
                                                            prop.type === 'boolean' ? false :
                                                                prop.type === 'object' ? {} : "value";
                                                    });
                                                }
                                                setFormData(prev => ({ ...prev, policyData: JSON.stringify(template, null, 2) }));
                                            }
                                        }}
                                        style={{
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            borderRadius: '0.25rem',
                                            color: 'var(--accent-blue)',
                                            fontSize: '0.75rem',
                                            padding: '0.35rem 0.75rem',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Generate Template
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1 }}>
                                {/* Editor */}
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '0.5rem',
                                        borderTopLeftRadius: '0.5rem',
                                        borderTopRightRadius: '0.5rem',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderBottom: 'none',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        fontWeight: '600'
                                    }}>
                                        INPUT JSON
                                    </div>
                                    <textarea
                                        value={formData.policyData}
                                        onChange={(e) => handleChange('policyData', e.target.value)}
                                        required
                                        spellCheck="false"
                                        style={{
                                            flex: 1,
                                            width: '100%',
                                            padding: '1rem',
                                            background: 'rgba(15, 23, 42, 0.4)',
                                            border: `1px solid ${jsonError ? 'var(--accent-red)' : isValidated ? 'var(--accent-green)' : 'rgba(148, 163, 184, 0.3)'}`,
                                            borderBottomLeftRadius: '0.5rem',
                                            borderBottomRightRadius: '0.5rem',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.85rem',
                                            fontFamily: 'monospace',
                                            outline: 'none',
                                            resize: 'none',
                                            lineHeight: '1.5'
                                        }}
                                    />
                                    {jsonError && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '1rem',
                                            left: '1rem',
                                            right: '1rem',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            color: 'var(--accent-red)',
                                            padding: '0.5rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            backdropFilter: 'blur(4px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <AlertCircle size={14} />
                                            {jsonError}
                                        </div>
                                    )}
                                    {isValidated && !jsonError && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '1rem',
                                            left: '1rem',
                                            right: '1rem',
                                            background: 'rgba(34, 197, 94, 0.1)',
                                            border: '1px solid rgba(34, 197, 94, 0.2)',
                                            color: 'var(--accent-green)',
                                            padding: '0.5rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.75rem',
                                            backdropFilter: 'blur(4px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <Check size={14} />
                                            Valid JSON
                                        </div>
                                    )}
                                </div>

                                {/* Schema View */}
                                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <div style={{
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '0.5rem',
                                        borderTopLeftRadius: '0.5rem',
                                        borderTopRightRadius: '0.5rem',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderBottom: 'none',
                                        fontSize: '0.75rem',
                                        color: 'var(--text-secondary)',
                                        fontWeight: '600'
                                    }}>
                                        SCHEMA DEFINITION
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        background: 'rgba(15, 23, 42, 0.4)',
                                        border: '1px solid rgba(148, 163, 184, 0.3)',
                                        borderBottomLeftRadius: '0.5rem',
                                        borderBottomRightRadius: '0.5rem',
                                        padding: '1rem',
                                        overflow: 'auto'
                                    }}>
                                        {formData.policyTypeId ? (
                                            <pre style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                                                {JSON.stringify(
                                                    policyTypes.find(t => (t.policytype_id || t.policy_type_id) === formData.policyTypeId)?.policy_schema || 'No schema available',
                                                    null, 2
                                                )}
                                            </pre>
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                                                Select a Policy Type to view its schema definition
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer - Fixed Height */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                    background: 'rgba(15, 23, 42, 0.9)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    flexShrink: 0,
                    zIndex: 10
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: '0.875rem 1.5rem',
                            background: 'transparent',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '0.5rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleValidate}
                        style={{
                            padding: '0.875rem 1.5rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '0.5rem',
                            color: 'var(--accent-blue)',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Check size={18} />
                        Validate JSON
                    </button>

                    <button
                        type="submit"
                        form="create-policy-form"
                        disabled={!isValidated || !!jsonError || !formData.policyTypeId || !formData.ric}
                        style={{
                            padding: '0.875rem 2rem',
                            background: (!isValidated || !!jsonError || !formData.policyTypeId || !formData.ric)
                                ? 'rgba(148, 163, 184, 0.1)'
                                : 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                            border: (!isValidated || !!jsonError || !formData.policyTypeId || !formData.ric)
                                ? '1px solid rgba(148, 163, 184, 0.2)'
                                : 'none',
                            borderRadius: '0.5rem',
                            color: (!isValidated || !!jsonError || !formData.policyTypeId || !formData.ric)
                                ? 'rgba(148, 163, 184, 0.4)'
                                : 'white',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: (!isValidated || !!jsonError || !formData.policyTypeId || !formData.ric) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            boxShadow: (!isValidated || !!jsonError || !formData.policyTypeId || !formData.ric)
                                ? 'none'
                                : '0 4px 12px rgba(59, 130, 246, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Save size={20} />
                        Submit to A1 Simulator
                    </button>
                </div>
            </div>

            <style>
                {`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
            </style>
        </div>
    );
};

export default CreatePolicyPanel;

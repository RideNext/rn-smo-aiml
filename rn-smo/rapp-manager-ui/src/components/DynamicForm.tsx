import { useState } from 'react';

interface FormField {
  name: string;
  type: string;
  required?: boolean;
  default?: any;
  description?: string;
}

interface DynamicFormProps {
  schema: { properties: Record<string, FormField> };
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export const DynamicForm = ({ schema, onSubmit, onCancel }: DynamicFormProps) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    Object.entries(schema.properties).forEach(([key, field]) => {
      initial[key] = field.default ?? '';
    });
    return initial;
  });

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (name: string, field: FormField) => {
    switch (field.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={formData[name] || false}
            onChange={e => handleChange(name, e.target.checked)}
          />
        );
      case 'integer':
      case 'number':
        return (
          <input
            type="number"
            value={formData[name] || ''}
            onChange={e => handleChange(name, Number(e.target.value))}
            required={field.required}
            style={{ width: '100%', padding: 8 }}
          />
        );
      default:
        return (
          <input
            type="text"
            value={formData[name] || ''}
            onChange={e => handleChange(name, e.target.value)}
            required={field.required}
            style={{ width: '100%', padding: 8 }}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {Object.entries(schema.properties).map(([name, field]) => (
        <div key={name} style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
            {name} {field.required && <span style={{ color: 'red' }}>*</span>}
          </label>
          {field.description && (
            <p style={{ fontSize: 12, color: '#666', marginBottom: 5 }}>{field.description}</p>
          )}
          {renderField(name, field)}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="submit">Deploy</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

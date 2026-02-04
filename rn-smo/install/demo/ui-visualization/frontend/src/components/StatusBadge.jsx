import React from 'react';
import { Activity, Power, MinusCircle } from 'lucide-react';

const StatusBadge = ({ action, color }) => {
    let Icon = MinusCircle;
    let statusClass = 'gray';

    if (action === 'SWITCH ON') {
        Icon = Power;
        statusClass = 'green';
    } else if (action === 'SWITCH OFF') {
        Icon = Power;
        statusClass = 'red';
    }

    return (
        <div className={`status-badge ${statusClass}`}>
            <Icon size={16} />
            <span>{action}</span>
        </div>
    );
};

export default StatusBadge;

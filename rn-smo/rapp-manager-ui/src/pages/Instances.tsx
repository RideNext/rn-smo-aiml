import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rappApi } from '../api/rappApi';

export const Instances = () => {
  const [selectedRapp, setSelectedRapp] = useState('');
  const queryClient = useQueryClient();

  const { data: rapps } = useQuery({
    queryKey: ['rapps'],
    queryFn: async () => (await rappApi.getRapps()).data
  });

  const { data: instances } = useQuery({
    queryKey: ['instances', selectedRapp],
    queryFn: async () => selectedRapp ? (await rappApi.getInstances(selectedRapp)).data : {},
    enabled: !!selectedRapp
  });

  const deploy = useMutation({
    mutationFn: ({ rappId, instanceId }: { rappId: string; instanceId: string }) =>
      rappApi.deployInstance(rappId, instanceId, 'DEPLOY'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] })
  });

  const undeploy = useMutation({
    mutationFn: ({ rappId, instanceId }: { rappId: string; instanceId: string }) =>
      rappApi.deployInstance(rappId, instanceId, 'UNDEPLOY'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['instances'] })
  });

  return (
    <div>
      <h1>rApp Instances</h1>
      
      <select onChange={e => setSelectedRapp(e.target.value)} style={{ padding: 8, marginBottom: 20 }}>
        <option value="">Select rApp</option>
        {rapps?.map(rapp => (
          <option key={rapp.rappId} value={rapp.rappId}>{rapp.name}</option>
        ))}
      </select>

      {instances && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              <th style={{ padding: 10, textAlign: 'left' }}>Instance ID</th>
              <th style={{ padding: 10, textAlign: 'left' }}>State</th>
              <th style={{ padding: 10, textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(instances).map(([id, instance]) => (
              <tr key={id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: 10 }}>{instance.rappInstanceId}</td>
                <td style={{ padding: 10 }}>{instance.state}</td>
                <td style={{ padding: 10 }}>
                  {instance.state === 'UNDEPLOYED' && (
                    <button onClick={() => deploy.mutate({ rappId: selectedRapp, instanceId: id })}>
                      Deploy
                    </button>
                  )}
                  {instance.state === 'DEPLOYED' && (
                    <button onClick={() => undeploy.mutate({ rappId: selectedRapp, instanceId: id })}>
                      Undeploy
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

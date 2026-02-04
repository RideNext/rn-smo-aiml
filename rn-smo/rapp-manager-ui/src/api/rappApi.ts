import client from './client';
import { Rapp, RappInstance, PrimeOrder, DeployOrder } from '../types';

export const rappApi = {
  getRapps: () => client.get<Rapp[]>(''),
  getRapp: (id: string) => client.get<Rapp>(`/${id}`),
  createRapp: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post(`/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteRapp: (id: string) => client.delete(`/${id}`),
  primeRapp: (id: string, order: PrimeOrder) => 
    client.put(`/${id}`, { primeOrder: order }),
  
  getInstances: (rappId: string) => 
    client.get<Record<string, RappInstance>>(`/${rappId}/instance`),
  getInstance: (rappId: string, instanceId: string) => 
    client.get<RappInstance>(`/${rappId}/instance/${instanceId}`),
  createInstance: (rappId: string, instance: Partial<RappInstance>) => 
    client.post<RappInstance>(`/${rappId}/instance`, instance),
  deployInstance: (rappId: string, instanceId: string, order: DeployOrder) => 
    client.put(`/${rappId}/instance/${instanceId}`, { deployOrder: order }),
  deleteInstance: (rappId: string, instanceId: string) => 
    client.delete(`/${rappId}/instance/${instanceId}`)
};

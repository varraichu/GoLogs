// src/services/api.ts
import axios from 'axios';

// const API = axios.create({ baseURL: '/api' });

// export const fetchGroups = () => API.get('/user-groups');

// api.ts
const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

export const fetchGroups = () => API.get('/user-groups');

export const fetchApplications = () => API.get('/applications');
export const fetchGroupApplications = (groupId: string) => API.get(`/assignments/group/${groupId}`);
export const updateGroupApplications = (groupId: string, appIds: string[]) =>
  API.post(`/assignments/update`, { groupId, appIds });

export default API;

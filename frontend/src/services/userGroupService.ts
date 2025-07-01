import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// token will be saved in localStorage or context after login
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getUserGroups = async () => {
  const res = await API.get('/user-groups');
  return res.data;
};

export const updateGroupAppAccess = async (groupId: string, appIds: string[]) => {
  return await API.patch(`/user-groups/${groupId}/app-access`, { appIds });
};

export const getAllApplications = async () => {
  const res = await fetch('/api/applications', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch applications');
  }

  return res.json();
};

import axios from 'axios';

export const api = {
  getProjects: () => axios.get('/api/projects').then(res => res.data),
  createProject: (name: string, description: string) => axios.post('/api/projects', { name, description }).then(res => res.data),
  getFiles: (projectId: string) => axios.get(`/api/projects/${projectId}/files`).then(res => res.data),
  getMessages: (projectId: string) => axios.get(`/api/projects/${projectId}/messages`).then(res => res.data),
  sendMessage: (projectId: string, message: string, model: string) => axios.post('/api/chat', { projectId, message, model }).then(res => res.data),
};

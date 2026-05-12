import axiosInstance from './axiosInstance';

export const projectsApi = {
  // Projects
  getProjects: (params?: any) => axiosInstance.get('/projects', { params }).then(r => r.data),
  getProject: (id: string) => axiosInstance.get(`/projects/${id}`).then(r => r.data),
  createProject: (data: any) => axiosInstance.post('/projects', data).then(r => r.data),
  updateProject: (id: string, data: any) => axiosInstance.put(`/projects/${id}`, data).then(r => r.data),
  deleteProject: (id: string) => axiosInstance.delete(`/projects/${id}`).then(r => r.data),
  getSummary: () => axiosInstance.get('/projects/summary').then(r => r.data),

  // Tasks
  getTasks: (projectId: string, params?: any) => axiosInstance.get(`/projects/${projectId}/tasks`, { params }).then(r => r.data),
  createTask: (projectId: string, data: any) => axiosInstance.post(`/projects/${projectId}/tasks`, data).then(r => r.data),
  getTask: (id: string) => axiosInstance.get(`/projects/tasks/${id}`).then(r => r.data),
  updateTask: (id: string, data: any) => axiosInstance.put(`/projects/tasks/${id}`, data).then(r => r.data),
  moveTask: (id: string, data: { status: number, position: number }) => axiosInstance.post(`/projects/tasks/${id}/move`, data).then(r => r.data),
  deleteTask: (id: string) => axiosInstance.delete(`/projects/tasks/${id}`).then(r => r.data),

  // Timesheets
  getTimesheets: (params?: any) => axiosInstance.get('/projects/timesheets', { params }).then(r => r.data),
  logTime: (data: any) => axiosInstance.post('/projects/timesheets', data).then(r => r.data),
};

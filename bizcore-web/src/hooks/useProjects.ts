import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects.api';

export const useProjects = (params?: any) => {
  const projects = useQuery({
    queryKey: ['projects', params?.status, params?.search],
    queryFn: () => projectsApi.getProjects(params),
  });

  const summary = useQuery({
    queryKey: ['projects-summary'],
    queryFn: () => projectsApi.getSummary(),
  });

  const tasks = (projectId?: string, status?: string) => useQuery({
    queryKey: ['tasks', projectId, status],
    queryFn: () => projectsApi.getTasks(projectId!, { status }),
    enabled: !!projectId,
  });

  const timesheets = (p?: any) => useQuery({
    queryKey: ['timesheets', p?.projectId, p?.employeeId, p?.fromDate, p?.toDate],
    queryFn: () => projectsApi.getTimesheets(p),
  });

  return { projects, summary, tasks, timesheets };
};

import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../api/hr.api';

export const useHR = (params?: any) => {
  const onlyMine = params?.onlyMine === true;
  const includeEmployees = params?.includeEmployees ?? !onlyMine;
  const includeAttendance = params?.includeAttendance ?? !onlyMine;
  const includeLeaves = params?.includeLeaves ?? true;
  const includePayroll = params?.includePayroll ?? !onlyMine;
  const includePayrollSummary = params?.includePayrollSummary ?? !onlyMine;
  const includeAssistance = params?.includeAssistance ?? !onlyMine;

  const employees = useQuery({
    queryKey: ['employees', params?.search, params?.department],
    queryFn: () => hrApi.getEmployees(params),
    enabled: includeEmployees,
  });

  const attendance = useQuery({
    queryKey: ['attendance', onlyMine, params?.employeeId, params?.month, params?.year],
    queryFn: () => (onlyMine ? hrApi.getMyAttendance(params) : hrApi.getAttendance(params)),
    enabled: includeAttendance,
  });

  const leaves = useQuery({
    queryKey: ['leaves', onlyMine, params?.leaveStatus, params?.employeeId],
    queryFn: () => (onlyMine ? hrApi.getMyLeaves(params) : hrApi.getLeaves(params)),
    enabled: includeLeaves,
  });

  const payroll = useQuery({
    queryKey: ['payroll', params?.month, params?.year],
    queryFn: () => hrApi.getPayroll(params),
    enabled: includePayroll,
  });

  const payrollSummary = useQuery({
    queryKey: ['payroll-summary', params?.month, params?.year],
    queryFn: () => hrApi.getPayrollSummary(params),
    enabled: includePayrollSummary,
  });

  const assistanceRequests = useQuery({
    queryKey: ['assistance-requests', onlyMine, params?.status, params?.employeeId],
    queryFn: () => (onlyMine ? hrApi.getMyAssistanceRequests(params) : hrApi.getAssistanceRequests(params)),
    enabled: includeAssistance,
  });

  return { employees, attendance, leaves, payroll, payrollSummary, assistanceRequests };
};

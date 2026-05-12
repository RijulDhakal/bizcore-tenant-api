import axiosInstance from './axiosInstance';

export const hrApi = {
  // Employees
  getEmployees: (params?: any) => axiosInstance.get('/hr/employees', { params }).then(r => r.data),
  getEmployee: (id: string) => axiosInstance.get(`/hr/employees/${id}`).then(r => r.data),
  createEmployee: (data: any) => axiosInstance.post('/hr/employees', data).then(r => r.data),
  updateEmployee: (id: string, data: any) => axiosInstance.put(`/hr/employees/${id}`, data).then(r => r.data),
  deleteEmployee: (id: string) => axiosInstance.delete(`/hr/employees/${id}`).then(r => r.data),

  // Attendance
  getAttendance: (params?: any) => axiosInstance.get('/hr/attendance', { params }).then(r => r.data),
  getMyAttendance: (params?: any) => axiosInstance.get('/attendance/my', { params }).then(r => r.data),
  markAttendance: (data: any) => axiosInstance.post('/hr/attendance', data).then(r => r.data),
  bulkMarkAttendance: (data: any) => axiosInstance.post('/hr/attendance/bulk', data).then(r => r.data),
  updateAttendance: (id: string, data: any) => axiosInstance.put(`/hr/attendance/${id}`, data).then(r => r.data),

  // Leaves
  getLeaves: (params?: any) => axiosInstance.get('/hr/leaves', { params }).then(r => r.data),
  getMyLeaves: (params?: any) => axiosInstance.get('/leaves/my', { params }).then(r => r.data),
  createLeave: (data: any) => axiosInstance.post('/leaves', data).then(r => r.data),
  cancelMyLeave: (id: string) => axiosInstance.delete(`/leaves/${id}`).then(r => r.data),
  approveLeave: (id: string) => axiosInstance.post(`/hr/leaves/${id}/approve`).then(r => r.data),
  rejectLeave: (id: string) => axiosInstance.post(`/hr/leaves/${id}/reject`).then(r => r.data),

  // Payroll
  getPayroll: (params?: any) => axiosInstance.get('/hr/payroll', { params }).then(r => r.data),
  getPayrollSummary: (params?: any) => axiosInstance.get('/hr/payroll/summary', { params }).then(r => r.data),
  generatePayroll: (month: number, year: number) => axiosInstance.post('/hr/payroll/generate', null, { params: { month, year } }).then(r => r.data),
  updatePayroll: (id: string, data: any) => axiosInstance.put(`/hr/payroll/${id}`, data).then(r => r.data),
  payPayroll: (id: string) => axiosInstance.post(`/hr/payroll/${id}/pay`).then(r => r.data),
  getMyPayslips: () => axiosInstance.get('/payroll/my-payslips').then(r => r.data),
  
  // Assistance Requests
  getAssistanceRequests: (params?: any) => axiosInstance.get('/hr/assistance', { params }).then(r => r.data),
  getMyAssistanceRequests: (params?: any) => axiosInstance.get('/hr-queries/my', { params }).then(r => r.data),
  createAssistanceRequest: (data: any) => axiosInstance.post('/hr-queries', data).then(r => r.data),
  resolveAssistanceRequest: (id: string, data: any) => axiosInstance.post(`/hr/assistance/${id}/resolve`, data).then(r => r.data),
};

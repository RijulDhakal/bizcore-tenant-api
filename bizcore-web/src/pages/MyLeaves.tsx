import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle
} from 'lucide-react';
import { useHR } from '../hooks/useHR';
import { hrApi } from '../api/hr.api';
import { toast } from 'sonner';

const MyLeaves: React.FC = () => {
  const { leaves } = useHR({ onlyMine: true, includeLeaves: true });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 0, // Sick
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await hrApi.createLeave(formData);
      if (!response?.success) {
        toast.error(response?.message || 'Failed to submit leave request');
        return;
      }
      toast.success(response?.message || 'Leave request submitted');
      setIsModalOpen(false);
      setFormData({
        leaveType: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      leaves.refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-700'; // Pending
      case 1: return 'bg-green-100 text-green-700';  // Approved
      case 2: return 'bg-red-100 text-red-700';    // Rejected
      case 3: return 'bg-gray-100 text-gray-700'; // Cancelled
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      case 3: return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const response = await hrApi.cancelMyLeave(id);
      if (!response?.success) {
        toast.error(response?.message || 'Failed to cancel request');
        return;
      }
      toast.success(response?.message || 'Leave request cancelled');
      leaves.refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getLeaveTypeLabel = (type: number) => {
    switch (type) {
      case 0: return 'Sick Leave';
      case 1: return 'Casual Leave';
      case 2: return 'Annual Leave';
      case 3: return 'Maternity Leave';
      case 4: return 'Unpaid Leave';
      default: return 'Other';
    }
  };

  const stats = {
    pending: leaves.data?.data?.filter((l: any) => l.status === 0).length || 0,
    approved: leaves.data?.data?.filter((l: any) => l.status === 1).length || 0,
    totalDays: leaves.data?.data?.filter((l: any) => l.status === 1).reduce((acc: number, l: any) => acc + l.totalDays, 0) || 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-500">Manage your time off and leave balance</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium tracking-tight uppercase">Days Taken</span>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalDays} Days</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium tracking-tight uppercase">Approved</span>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium tracking-tight uppercase">Pending Requests</span>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaves.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    Loading leaf requests...
                  </td>
                </tr>
              ) : leaves.data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                leaves.data?.data?.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getLeaveTypeLabel(item.leaveType)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm italic">
                      {new Date(item.startDate).toLocaleDateString()} to {new Date(item.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">{item.totalDays} Days</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">{item.reason || '-'}</td>
                    <td className="px-6 py-4">
                      {item.status === 0 ? (
                        <button
                          onClick={() => handleCancel(item.id)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600">
              <h2 className="text-lg font-semibold text-white">Request Leave</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  value={formData.leaveType}
                  onChange={(e) => setFormData({ ...formData, leaveType: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Sick Leave</option>
                  <option value={1}>Casual Leave</option>
                  <option value={2}>Annual Leave</option>
                  <option value={4}>Unpaid Leave</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Briefly explain the reason for your leave request..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;

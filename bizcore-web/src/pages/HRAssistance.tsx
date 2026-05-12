import React, { useState } from 'react';
import { 
  Send, 
  MessageSquare, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useHR } from '../hooks/useHR';
import { hrApi } from '../api/hr.api';
import { toast } from 'sonner';

const HRAssistance: React.FC = () => {
  const { assistanceRequests } = useHR({ onlyMine: true, includeAssistance: true });
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'General',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await hrApi.createAssistanceRequest(formData);
      if (!response?.success) {
        toast.error(response?.message || 'Failed to send request');
        return;
      }
      toast.success(response?.message || 'Request sent to HR');
      setIsRequestModalOpen(false);
      setFormData({ category: 'General', subject: '', message: '' });
      assistanceRequests.refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to send request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'inprogress': return 'bg-blue-100 text-blue-700';
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Assistance</h1>
          <p className="text-gray-500">Need help? Send a message to the HR department</p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          New Request
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {assistanceRequests.isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : assistanceRequests.data?.data?.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No requests yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              If you have any questions about your salary, leaves, or attendance, reach out to HR here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {assistanceRequests.data?.data?.map((request: any) => (
              <div key={request.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">{request.category}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{request.subject}</h3>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{request.message}</p>
                  
                  <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 flex justify-between items-center">
                    <span>Requested on {new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>

                  {request.response && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        </div>
                        <span className="text-xs font-semibold text-gray-700">HR Response</span>
                      </div>
                      <p className="text-sm text-gray-600">{request.response}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600">
              <h2 className="text-lg font-semibold text-white">New Assistance Request</h2>
              <button onClick={() => setIsRequestModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="General">General Inquiry</option>
                  <option value="Leave">Leave Related</option>
                  <option value="Attendance">Attendance Correction</option>
                  <option value="Salary">Payroll / Salary</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Query about my sick leave balance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue or question in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAssistance;

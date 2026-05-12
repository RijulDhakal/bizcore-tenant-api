import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Filter
} from 'lucide-react';
import { useHR } from '../hooks/useHR';

const MyAttendance: React.FC = () => {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const { attendance } = useHR({ onlyMine: true, includeAttendance: true, month, year });

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-green-100 text-green-700'; // Present
      case 1: return 'bg-red-100 text-red-700';   // Absent
      case 2: return 'bg-yellow-100 text-yellow-700'; // Late
      case 3: return 'bg-blue-100 text-blue-700';  // On Leave
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Present';
      case 1: return 'Absent';
      case 2: return 'Late';
      case 3: return 'On Leave';
      default: return 'Unknown';
    }
  };

  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1));

  const stats = {
    present: attendance.data?.data?.filter((a: any) => a.status === 0).length || 0,
    late: attendance.data?.data?.filter((a: any) => a.status === 2).length || 0,
    absent: attendance.data?.data?.filter((a: any) => a.status === 1).length || 0,
    totalHours: attendance.data?.data?.reduce((acc: number, a: any) => acc + (a.workingHours || 0), 0).toFixed(1) || '0.0'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500">Track your daily attendance and working hours</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="text-sm border-none focus:ring-0 bg-transparent py-1 pr-8"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(2000, i))}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="text-sm border-none focus:ring-0 bg-transparent py-1 pr-8"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium tracking-tight uppercase">Present Days</span>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium tracking-tight uppercase">Late Arrivals</span>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium tracking-tight uppercase">Absences</span>
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-medium tracking-tight uppercase">Total Hours</span>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Log for {currentMonthName} {year}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Working Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendance.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    Loading your attendance data...
                  </td>
                </tr>
              ) : attendance.data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                attendance.data?.data?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{item.checkIn || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{item.checkOut || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">{item.workingHours?.toFixed(1) || '0.0'} hrs</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs truncate">{item.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;

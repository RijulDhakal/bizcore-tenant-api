import React from 'react';
import { Download, Receipt } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../api/hr.api';
import { formatCurrency } from '../utils/format';

const MyPayslips: React.FC = () => {
  const payslips = useQuery({
    queryKey: ['my-payslips'],
    queryFn: () => hrApi.getMyPayslips(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
        <p className="text-gray-500">View your monthly payroll records</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Payslip History</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Basic</th>
                <th className="px-6 py-4">Deductions</th>
                <th className="px-6 py-4">Net</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payslips.isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    Loading payslips...
                  </td>
                </tr>
              ) : (payslips.data?.data?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    No payslips available.
                  </td>
                </tr>
              ) : (
                payslips.data?.data?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Date(item.year, item.month - 1).toLocaleString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{formatCurrency(item.basicSalary)}</td>
                    <td className="px-6 py-4 text-gray-700">{formatCurrency(item.deductions)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(item.netSalary)}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-gray-500 flex items-center gap-2">
        <Receipt className="h-4 w-4" />
        PDF download action is placeholder until dedicated payslip document API is integrated.
      </div>
    </div>
  );
};

export default MyPayslips;

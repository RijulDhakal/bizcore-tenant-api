import { useQuery } from '@tanstack/react-query';
import { demandForecastApi } from '../api/modules.api';
import {
  TrendingUp,
  AlertTriangle,
  PackageCheck,
  BarChart3,
  ArrowDown,
  ArrowUp,
  Package,
} from 'lucide-react';

interface ForecastItem {
  productId: string;
  productName: string;
  sku: string;
  avgWeeklySales: number;
  currentStock: number;
  weeksRemaining: number;
  reorderSuggested: number;
  variance: number;
  riskLevel: string;
}

const RISK_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  Low: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  Healthy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
};

const RISK_ICONS: Record<string, typeof AlertTriangle> = {
  Critical: AlertTriangle,
  Low: ArrowDown,
  Medium: ArrowUp,
  Healthy: PackageCheck,
};

export default function DemandForecast() {
  const { data: forecast = [], isLoading } = useQuery<ForecastItem[]>({
    queryKey: ['demand-forecast'],
    queryFn: async () => {
      const res = await demandForecastApi.getForecast();
      return res.data?.data || [];
    },
  });

  const stats = {
    critical: forecast.filter(f => f.riskLevel === 'Critical').length,
    low: forecast.filter(f => f.riskLevel === 'Low').length,
    medium: forecast.filter(f => f.riskLevel === 'Medium').length,
    healthy: forecast.filter(f => f.riskLevel === 'Healthy').length,
    totalReorderNeeded: forecast.filter(f => f.reorderSuggested > 0).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <BarChart3 className="h-5 w-5 mr-2 animate-spin" />
        Analyzing demand patterns...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Demand Forecast
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          90-day bullwhip effect analysis — reorder suggestions based on sales velocity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Critical', value: stats.critical, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'Low Stock', value: stats.low, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
          { label: 'Medium', value: stats.medium, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Healthy', value: stats.healthy, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Need Reorder', value: stats.totalReorderNeeded, color: 'text-primary', bg: 'bg-primary/5' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border`}>
            <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color} mt-1`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Forecast Table */}
      {forecast.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No products found for forecast analysis</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Product</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Avg Weekly Sales</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Current Stock</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Weeks Left</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Reorder Qty</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Variance</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((item: ForecastItem) => {
                const RiskIcon = RISK_ICONS[item.riskLevel] || PackageCheck;
                return (
                  <tr key={item.productId} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium">{item.productName}</span>
                        <span className="block text-xs text-muted-foreground">{item.sku}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono">{item.avgWeeklySales}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono">{item.currentStock}</td>
                    <td className="px-4 py-3 text-right text-sm font-mono">
                      {item.weeksRemaining >= 999 ? '∞' : item.weeksRemaining}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono">
                      {item.reorderSuggested > 0 ? (
                        <span className="text-orange-600 font-semibold">+{item.reorderSuggested}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">
                      {item.variance.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_COLORS[item.riskLevel] || RISK_COLORS.Healthy}`}>
                        <RiskIcon className="h-3 w-3" />
                        {item.riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

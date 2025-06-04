import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Receipt, TrendingUp, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/types";

export default function SummaryCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="ml-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const todayProfit = parseFloat(stats?.todaySales || '0') - parseFloat(stats?.todayExpenses || '0');
  const weeklyProfit = parseFloat(stats?.thisWeekSales || '0') - parseFloat(stats?.thisWeekExpenses || '0');

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.todaySales || '0')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Receipt className="text-red-600 text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.todayExpenses || '0')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-blue-600 text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(todayProfit.toString())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-orange-600 text-xl" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.thisWeekSales || '0')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {stats?.salesTrend?.length > 0 ? (
                stats.salesTrend.map((item: any, index: number) => {
                  const maxAmount = Math.max(...stats.salesTrend.map((s: any) => parseFloat(s.amount)));
                  const height = maxAmount > 0 ? (parseFloat(item.amount) / maxAmount) * 200 : 20;
                  const date = new Date(item.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-primary rounded-t max-w-8" 
                        style={{ height: `${Math.max(height, 20)}px` }}
                        title={`${dayName}: ${formatCurrency(item.amount)}`}
                      ></div>
                      <span className="text-xs text-gray-600 mt-2">{dayName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 text-center text-gray-500">
                  No sales data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Expense Categories */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expense Categories</h3>
            <div className="space-y-4">
              {stats?.expensesByCategory?.length > 0 ? (
                stats.expensesByCategory.map((category: any, index: number) => {
                  const colors = ['bg-red-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500'];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${colors[index % colors.length]} rounded-full mr-3`}></div>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {category.category}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500">
                  No expense data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Comparison */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.thisWeekSales || '0')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.thisWeekExpenses || '0')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${weeklyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(weeklyProfit.toString())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

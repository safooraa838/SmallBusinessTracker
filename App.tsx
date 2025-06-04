import React, { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Store, ChartLine, Plus, List, LogOut, DollarSign, Receipt, TrendingUp, Calendar, Edit, Trash2 } from "lucide-react";

// Types
interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Sale {
  id: number;
  userId: string;
  amount: string;
  category: string;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: number;
  userId: string;
  amount: string;
  type: string;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: number;
  type: 'sale' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string | null;
}

// LocalStorage Service
class LocalStorageService {
  private STORAGE_KEYS = {
    USER: 'retailtracker_user',
    SALES: 'retailtracker_sales',
    EXPENSES: 'retailtracker_expenses',
    AUTH_TOKEN: 'retailtracker_auth_token',
  } as const;

  private DEMO_USER: User = {
    id: 'demo-user-123',
    email: 'demo@retailtracker.com',
    firstName: 'Demo',
    lastName: 'User',
    profileImageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const user = { ...this.DEMO_USER, email };
          localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
          localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, 'demo-token-123');
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    localStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.STORAGE_KEYS.USER);
    const token = localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
    
    if (userStr && token) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  getSales(): Sale[] {
    const salesStr = localStorage.getItem(this.STORAGE_KEYS.SALES);
    if (salesStr) {
      try {
        return JSON.parse(salesStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  createSale(saleData: any): Sale {
    const sales = this.getSales();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const newSale: Sale = {
      id: Date.now(),
      userId: user.id,
      amount: saleData.amount,
      category: saleData.category,
      date: saleData.date,
      notes: saleData.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sales.push(newSale);
    localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(sales));
    return newSale;
  }

  updateSale(id: number, saleData: any): Sale {
    const sales = this.getSales();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const saleIndex = sales.findIndex(s => s.id === id && s.userId === user.id);
    if (saleIndex === -1) throw new Error('Sale not found');

    const updatedSale = {
      ...sales[saleIndex],
      ...saleData,
      updatedAt: new Date().toISOString(),
    };

    sales[saleIndex] = updatedSale;
    localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(sales));
    return updatedSale;
  }

  deleteSale(id: number): void {
    const sales = this.getSales();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const filteredSales = sales.filter(s => !(s.id === id && s.userId === user.id));
    localStorage.setItem(this.STORAGE_KEYS.SALES, JSON.stringify(filteredSales));
  }

  getExpenses(): Expense[] {
    const expensesStr = localStorage.getItem(this.STORAGE_KEYS.EXPENSES);
    if (expensesStr) {
      try {
        return JSON.parse(expensesStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  createExpense(expenseData: any): Expense {
    const expenses = this.getExpenses();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const newExpense: Expense = {
      id: Date.now(),
      userId: user.id,
      amount: expenseData.amount,
      type: expenseData.type,
      date: expenseData.date,
      description: expenseData.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expenses.push(newExpense);
    localStorage.setItem(this.STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return newExpense;
  }

  updateExpense(id: number, expenseData: any): Expense {
    const expenses = this.getExpenses();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const expenseIndex = expenses.findIndex(e => e.id === id && e.userId === user.id);
    if (expenseIndex === -1) throw new Error('Expense not found');

    const updatedExpense = {
      ...expenses[expenseIndex],
      ...expenseData,
      updatedAt: new Date().toISOString(),
    };

    expenses[expenseIndex] = updatedExpense;
    localStorage.setItem(this.STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return updatedExpense;
  }

  deleteExpense(id: number): void {
    const expenses = this.getExpenses();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const filteredExpenses = expenses.filter(e => !(e.id === id && e.userId === user.id));
    localStorage.setItem(this.STORAGE_KEYS.EXPENSES, JSON.stringify(filteredExpenses));
  }

  getDashboardStats() {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const sales = this.getSales().filter(s => s.userId === user.id);
    const expenses = this.getExpenses().filter(e => e.userId === user.id);

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const todaySales = sales
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);

    const todayExpenses = expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const thisWeekSales = sales
      .filter(s => s.date >= weekAgo)
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);

    const thisWeekExpenses = expenses
      .filter(e => e.date >= weekAgo)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const expensesByCategory: Record<string, number> = {};
    expenses
      .filter(e => e.date >= weekAgo)
      .forEach(e => {
        expensesByCategory[e.type] = (expensesByCategory[e.type] || 0) + parseFloat(e.amount);
      });

    const expensesByCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount: amount.toString() }))
      .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
      .slice(0, 5);

    const salesByDate: Record<string, number> = {};
    sales
      .filter(s => s.date >= weekAgo)
      .forEach(s => {
        salesByDate[s.date] = (salesByDate[s.date] || 0) + parseFloat(s.amount);
      });

    const salesTrend = Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount: amount.toString() }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      todaySales: todaySales.toString(),
      todayExpenses: todayExpenses.toString(),
      thisWeekSales: thisWeekSales.toString(),
      thisWeekExpenses: thisWeekExpenses.toString(),
      expensesByCategory: expensesByCategoryArray,
      salesTrend,
    };
  }

  getTransactions(): Transaction[] {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const sales = this.getSales()
      .filter(s => s.userId === user.id)
      .map(sale => ({
        id: sale.id,
        type: 'sale' as const,
        amount: sale.amount,
        category: sale.category,
        date: sale.date,
        description: sale.notes,
      }));

    const expenses = this.getExpenses()
      .filter(e => e.userId === user.id)
      .map(expense => ({
        id: expense.id,
        type: 'expense' as const,
        amount: expense.amount,
        category: expense.type,
        date: expense.date,
        description: expense.description,
      }));

    return [...sales, ...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

const localStorageService = new LocalStorageService();

// Utility functions
function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(isNaN(num) ? 0 : num);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Auth Hook
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const currentUser = localStorageService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await localStorageService.login(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorageService.logout();
    setUser(null);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}

// Components
function Button({ children, className = '', variant = 'default', size = 'default', disabled = false, onClick, type = 'button', ...props }: any) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50',
    ghost: 'hover:bg-gray-100 text-gray-700',
  };
  
  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8',
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className = '', type = 'text', ...props }: any) {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

function Label({ children, htmlFor, className = '' }: any) {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
      {children}
    </label>
  );
}

function Card({ children, className = '' }: any) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function CardContent({ children, className = '' }: any) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

function Select({ children, value, onValueChange }: any) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
    </select>
  );
}

function SelectOption({ children, value }: any) {
  return <option value={value}>{children}</option>;
}

function Textarea({ className = '', rows = 3, ...props }: any) {
  return (
    <textarea
      rows={rows}
      className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

function Badge({ children, variant = 'default', className = '' }: any) {
  const variants = {
    default: 'bg-blue-100 text-blue-800',
    destructive: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

function Dialog({ children, open, onOpenChange }: any) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
}

function DialogContent({ children }: any) {
  return <div className="p-6">{children}</div>;
}

function DialogHeader({ children }: any) {
  return <div className="mb-4">{children}</div>;
}

function DialogTitle({ children }: any) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

function Toaster() {
  return <div id="toast-container" className="fixed top-4 right-4 z-50"></div>;
}

function useToast() {
  const toast = ({ title, description, variant = 'default' }: any) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toastElement = document.createElement('div');
    toastElement.className = `mb-2 p-4 rounded-md shadow-lg ${
      variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-white border border-gray-200'
    }`;
    
    toastElement.innerHTML = `
      <div class="font-medium">${title}</div>
      ${description ? `<div class="text-sm opacity-90">${description}</div>` : ''}
    `;

    container.appendChild(toastElement);

    setTimeout(() => {
      container.removeChild(toastElement);
    }, 3000);
  };

  return { toast };
}

// Pages
function Landing() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }

    try {
      await login(email, password);
      toast({
        title: 'Success',
        description: 'Welcome to RetailTracker!'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid credentials',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <Card className="w-full max-w-md">
        <CardContent>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">RetailTracker</h1>
            <p className="text-gray-600 mt-2">Track your sales and expenses</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Demo app - use any email and password to sign in
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Navigation({ activeTab, onTabChange }: any) {
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: ChartLine },
    { id: 'entries', label: 'Add Entry', icon: Plus },
    { id: 'transactions', label: 'Transactions', icon: List },
  ];

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Store className="text-white" size={16} />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">RetailTracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.firstName || user?.email || 'User'}'s Store
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="inline mr-2" size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}

function SummaryCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => localStorageService.getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const todayProfit = parseFloat(stats?.todaySales || '0') - parseFloat(stats?.todayExpenses || '0');

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={24} />
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
          <CardContent>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Receipt className="text-red-600" size={24} />
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
          <CardContent>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-blue-600" size={24} />
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
          <CardContent>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-orange-600" size={24} />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 7 Days)</h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {stats?.salesTrend && stats.salesTrend.length > 0 ? (
                stats.salesTrend.map((item: any, index: number) => {
                  const maxAmount = Math.max(...stats.salesTrend!.map((s: any) => parseFloat(s.amount)));
                  const height = maxAmount > 0 ? (parseFloat(item.amount) / maxAmount) * 200 : 20;
                  const date = new Date(item.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-blue-600 rounded-t max-w-8" 
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

        <Card>
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expense Categories</h3>
            <div className="space-y-4">
              {stats?.expensesByCategory && stats.expensesByCategory.length > 0 ? (
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
    </div>
  );
}

function EntryForm() {
  const [entryType, setEntryType] = useState<'sale' | 'expense'>('sale');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => localStorageService.createSale(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Sale entry saved successfully!' });
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save sale entry',
        variant: 'destructive'
      });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => localStorageService.createExpense(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Expense entry saved successfully!' });
      setAmount('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save expense entry',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category || !date) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const data = entryType === 'sale' 
      ? { amount, category, date, notes }
      : { amount, type: category, date, description: notes };

    if (entryType === 'sale') {
      createSaleMutation.mutate(data);
    } else {
      createExpenseMutation.mutate(data);
    }
  };

  const clearForm = () => {
    setAmount('');
    setCategory('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Entry</h2>
      
      <Card>
        <CardContent>
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <Button
              type="button"
              variant={entryType === 'sale' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setEntryType('sale')}
            >
              <DollarSign className="mr-2" size={16} />
              Sale
            </Button>
            <Button
              type="button"
              variant={entryType === 'expense' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setEntryType('expense')}
            >
              <Receipt className="mr-2" size={16} />
              Expense
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-8"
                    value={amount}
                    onChange={(e: any) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e: any) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">{entryType === 'sale' ? 'Category' : 'Type'}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectOption value="">Select {entryType === 'sale' ? 'category' : 'type'}</SelectOption>
                {entryType === 'sale' ? (
                  <>
                    <SelectOption value="retail">Retail Sales</SelectOption>
                    <SelectOption value="online">Online Sales</SelectOption>
                    <SelectOption value="service">Service Revenue</SelectOption>
                    <SelectOption value="other">Other</SelectOption>
                  </>
                ) : (
                  <>
                    <SelectOption value="inventory">Inventory</SelectOption>
                    <SelectOption value="rent">Rent</SelectOption>
                    <SelectOption value="utilities">Utilities</SelectOption>
                    <SelectOption value="marketing">Marketing</SelectOption>
                    <SelectOption value="supplies">Office Supplies</SelectOption>
                    <SelectOption value="other">Other</SelectOption>
                  </>
                )}
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">{entryType === 'sale' ? 'Notes (Optional)' : 'Description'}</Label>
              <Textarea
                id="notes"
                placeholder={entryType === 'sale' ? 'Add any additional details...' : 'Describe the expense...'}
                value={notes}
                onChange={(e: any) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex space-x-4 mt-6">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createSaleMutation.isPending || createExpenseMutation.isPending}
              >
                {(createSaleMutation.isPending || createExpenseMutation.isPending) ? 'Saving...' : 'Save Entry'}
              </Button>
              <Button type="button" variant="outline" onClick={clearForm}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionsList() {
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: () => localStorageService.getTransactions(),
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'sale' | 'expense' }) => {
      if (type === 'sale') {
        localStorageService.deleteSale(id);
      } else {
        localStorageService.deleteExpense(id);
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Transaction deleted successfully!' });
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete transaction',
        variant: 'destructive'
      });
    },
  });

  const handleDelete = (transaction: Transaction) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate({ id: transaction.id, type: transaction.type });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
        <Card>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Amount</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction: Transaction) => (
                    <tr key={`${transaction.type}-${transaction.id}`} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={transaction.type === 'sale' ? 'default' : 'destructive'}
                          className={transaction.type === 'sale' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                          }
                        >
                          {transaction.type === 'sale' ? (
                            <>
                              <DollarSign className="mr-1" size={12} />
                              Sale
                            </>
                          ) : (
                            <>
                              <Receipt className="mr-1" size={12} />
                              Expense
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="p-4 capitalize">
                        {transaction.category}
                      </td>
                      <td className="p-4">
                        <span className={`font-medium ${
                          transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate">
                        {transaction.description || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction)}
                            className="text-red-600 hover:text-red-800"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}

function EditTransactionModal({ transaction, onClose }: any) {
  const [amount, setAmount] = useState(transaction.amount);
  const [category, setCategory] = useState(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (transaction.type === 'sale') {
        return localStorageService.updateSale(transaction.id, {
          amount: data.amount,
          category: data.category,
          date: data.date,
          notes: data.description,
        });
      } else {
        return localStorageService.updateExpense(transaction.id, {
          amount: data.amount,
          type: data.category,
          date: data.date,
          description: data.description,
        });
      }
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Transaction updated successfully!' });
      queryClient.invalidateQueries();
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update transaction',
        variant: 'destructive'
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ amount, category, date, description });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit {transaction.type === 'sale' ? 'Sale' : 'Expense'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-8"
                value={amount}
                onChange={(e: any) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e: any) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">{transaction.type === 'sale' ? 'Category' : 'Type'}</Label>
            <Select value={category} onValueChange={setCategory}>
              {transaction.type === 'sale' ? (
                <>
                  <SelectOption value="retail">Retail Sales</SelectOption>
                  <SelectOption value="online">Online Sales</SelectOption>
                  <SelectOption value="service">Service Revenue</SelectOption>
                  <SelectOption value="other">Other</SelectOption>
                </>
              ) : (
                <>
                  <SelectOption value="inventory">Inventory</SelectOption>
                  <SelectOption value="rent">Rent</SelectOption>
                  <SelectOption value="utilities">Utilities</SelectOption>
                  <SelectOption value="marketing">Marketing</SelectOption>
                  <SelectOption value="supplies">Office Supplies</SelectOption>
                  <SelectOption value="other">Other</SelectOption>
                </>
              )}
            </Select>
          </div>

          <div>
            <Label htmlFor="description">{transaction.type === 'sale' ? 'Notes' : 'Description'}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e: any) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entries' | 'transactions'>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <SummaryCards />}
        {activeTab === 'entries' && <EntryForm />}
        {activeTab === 'transactions' && <TransactionsList />}
      </main>
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
        </>
      )}
      <Route>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600">The page you're looking for doesn't exist.</p>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

// Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
  },
});

// Main App
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}
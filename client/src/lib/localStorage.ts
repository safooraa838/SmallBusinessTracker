import type { User, Sale, Expense, InsertSale, InsertExpense } from "@shared/schema";

const STORAGE_KEYS = {
  USER: 'retailtracker_user',
  SALES: 'retailtracker_sales',
  EXPENSES: 'retailtracker_expenses',
  AUTH_TOKEN: 'retailtracker_auth_token',
} as const;

// Mock user for demo purposes
const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@retailtracker.com',
  firstName: 'Demo',
  lastName: 'User',
  profileImageUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export class LocalStorageService {
  // Auth methods
  login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple demo auth - accept any email/password
        if (email && password) {
          const user = { ...DEMO_USER, email };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'demo-token-123');
          resolve(user);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500); // Simulate network delay
    });
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
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

  // Sales methods
  getSales(): Sale[] {
    const salesStr = localStorage.getItem(STORAGE_KEYS.SALES);
    if (salesStr) {
      try {
        return JSON.parse(salesStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  createSale(saleData: InsertSale): Sale {
    const sales = this.getSales();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const newSale: Sale = {
      id: Date.now(), // Simple ID generation
      userId: user.id,
      amount: saleData.amount,
      category: saleData.category,
      date: saleData.date,
      notes: saleData.notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    sales.push(newSale);
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    return newSale;
  }

  updateSale(id: number, saleData: Partial<InsertSale>): Sale {
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
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    return updatedSale;
  }

  deleteSale(id: number): void {
    const sales = this.getSales();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const filteredSales = sales.filter(s => !(s.id === id && s.userId === user.id));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(filteredSales));
  }

  // Expense methods
  getExpenses(): Expense[] {
    const expensesStr = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (expensesStr) {
      try {
        return JSON.parse(expensesStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  createExpense(expenseData: InsertExpense): Expense {
    const expenses = this.getExpenses();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const newExpense: Expense = {
      id: Date.now(), // Simple ID generation
      userId: user.id,
      amount: expenseData.amount,
      type: expenseData.type,
      date: expenseData.date,
      description: expenseData.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expenses.push(newExpense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return newExpense;
  }

  updateExpense(id: number, expenseData: Partial<InsertExpense>): Expense {
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
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    return updatedExpense;
  }

  deleteExpense(id: number): void {
    const expenses = this.getExpenses();
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const filteredExpenses = expenses.filter(e => !(e.id === id && e.userId === user.id));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(filteredExpenses));
  }

  // Analytics methods
  getDashboardStats(): {
    todaySales: string;
    todayExpenses: string;
    thisWeekSales: string;
    thisWeekExpenses: string;
    expensesByCategory: Array<{ category: string; amount: string }>;
    salesTrend: Array<{ date: string; amount: string }>;
  } {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const sales = this.getSales().filter(s => s.userId === user.id);
    const expenses = this.getExpenses().filter(e => e.userId === user.id);

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's sales and expenses
    const todaySales = sales
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);

    const todayExpenses = expenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // This week's sales and expenses
    const thisWeekSales = sales
      .filter(s => s.date >= weekAgo)
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);

    const thisWeekExpenses = expenses
      .filter(e => e.date >= weekAgo)
      .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Expenses by category
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

    // Sales trend (last 7 days)
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

  // Transaction methods (combined view)
  getTransactions(startDate?: string, endDate?: string, type?: 'sale' | 'expense'): any[] {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    let transactions: any[] = [];

    if (!type || type === 'sale') {
      const sales = this.getSales()
        .filter(s => s.userId === user.id)
        .map(sale => ({
          id: sale.id,
          type: 'sale' as const,
          amount: sale.amount,
          category: sale.category,
          date: sale.date,
          description: sale.notes,
          createdAt: sale.createdAt,
        }));
      transactions.push(...sales);
    }

    if (!type || type === 'expense') {
      const expenses = this.getExpenses()
        .filter(e => e.userId === user.id)
        .map(expense => ({
          id: expense.id,
          type: 'expense' as const,
          amount: expense.amount,
          category: expense.type,
          date: expense.date,
          description: expense.description,
          createdAt: expense.createdAt,
        }));
      transactions.push(...expenses);
    }

    // Filter by date range
    if (startDate && endDate) {
      transactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
    }

    // Sort by date (newest first)
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const localStorageService = new LocalStorageService();
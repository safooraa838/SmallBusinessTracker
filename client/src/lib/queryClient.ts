import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { localStorageService } from "./localStorage";

// Mock API function that uses localStorage
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  data?: any
): Promise<{ json: () => Promise<any> }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    let result: any;

    if (path === "/api/dashboard/stats") {
      result = localStorageService.getDashboardStats();
    } else if (path === "/api/transactions") {
      result = localStorageService.getTransactions();
    } else if (path === "/api/sales") {
      if (method === "GET") {
        result = localStorageService.getSales();
      } else if (method === "POST") {
        result = localStorageService.createSale(data);
      }
    } else if (path.startsWith("/api/sales/")) {
      const id = parseInt(path.split("/")[3]);
      if (method === "PUT") {
        result = localStorageService.updateSale(id, data);
      } else if (method === "DELETE") {
        localStorageService.deleteSale(id);
        result = { message: "Sale deleted successfully" };
      }
    } else if (path === "/api/expenses") {
      if (method === "GET") {
        result = localStorageService.getExpenses();
      } else if (method === "POST") {
        result = localStorageService.createExpense(data);
      }
    } else if (path.startsWith("/api/expenses/")) {
      const id = parseInt(path.split("/")[3]);
      if (method === "PUT") {
        result = localStorageService.updateExpense(id, data);
      } else if (method === "DELETE") {
        localStorageService.deleteExpense(id);
        result = { message: "Expense deleted successfully" };
      }
    } else {
      throw new Error(`Unknown endpoint: ${path}`);
    }

    return {
      json: async () => result,
    };
  } catch (error) {
    throw error;
  }
}

// Custom query function for localStorage
const localStorageQueryFn: QueryFunction = async ({ queryKey }) => {
  const [path, ...params] = queryKey;
  
  if (path === "/api/dashboard/stats") {
    return localStorageService.getDashboardStats();
  } else if (path === "/api/transactions") {
    const [, dateRange, typeFilter] = queryKey;
    const getDateRange = () => {
      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      switch (dateRange) {
        case 'today':
          return { startDate: formatDate(today), endDate: formatDate(today) };
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return { startDate: formatDate(weekAgo), endDate: formatDate(today) };
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          return { startDate: formatDate(monthAgo), endDate: formatDate(today) };
        default:
          return {};
      }
    };
    
    const range = getDateRange();
    const typeParam = typeFilter !== 'all' ? typeFilter as 'sale' | 'expense' : undefined;
    return localStorageService.getTransactions(range.startDate, range.endDate, typeParam);
  } else if (path === "/api/sales") {
    return localStorageService.getSales();
  } else if (path === "/api/expenses") {
    return localStorageService.getExpenses();
  }
  
  return null;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: localStorageQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

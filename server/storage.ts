import {
  users,
  sales,
  expenses,
  type User,
  type UpsertUser,
  type Sale,
  type InsertSale,
  type Expense,
  type InsertExpense,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Sales operations
  createSale(userId: string, sale: InsertSale): Promise<Sale>;
  getSales(userId: string, startDate?: string, endDate?: string): Promise<Sale[]>;
  updateSale(id: number, userId: string, sale: Partial<InsertSale>): Promise<Sale>;
  deleteSale(id: number, userId: string): Promise<void>;
  
  // Expense operations
  createExpense(userId: string, expense: InsertExpense): Promise<Expense>;
  getExpenses(userId: string, startDate?: string, endDate?: string): Promise<Expense[]>;
  updateExpense(id: number, userId: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number, userId: string): Promise<void>;
  
  // Analytics operations
  getDashboardStats(userId: string): Promise<{
    todaySales: string;
    todayExpenses: string;
    thisWeekSales: string;
    thisWeekExpenses: string;
    expensesByCategory: Array<{ category: string; amount: string }>;
    salesTrend: Array<{ date: string; amount: string }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Sales operations
  async createSale(userId: string, sale: InsertSale): Promise<Sale> {
    const [newSale] = await db
      .insert(sales)
      .values({ ...sale, userId })
      .returning();
    return newSale;
  }

  async getSales(userId: string, startDate?: string, endDate?: string): Promise<Sale[]> {
    let query = db.select().from(sales).where(eq(sales.userId, userId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(sales.userId, userId),
          gte(sales.date, startDate),
          lte(sales.date, endDate)
        )
      );
    }
    
    return await query.orderBy(desc(sales.date), desc(sales.createdAt));
  }

  async updateSale(id: number, userId: string, sale: Partial<InsertSale>): Promise<Sale> {
    const [updatedSale] = await db
      .update(sales)
      .set({ ...sale, updatedAt: new Date() })
      .where(and(eq(sales.id, id), eq(sales.userId, userId)))
      .returning();
    return updatedSale;
  }

  async deleteSale(id: number, userId: string): Promise<void> {
    await db
      .delete(sales)
      .where(and(eq(sales.id, id), eq(sales.userId, userId)));
  }

  // Expense operations
  async createExpense(userId: string, expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values({ ...expense, userId })
      .returning();
    return newExpense;
  }

  async getExpenses(userId: string, startDate?: string, endDate?: string): Promise<Expense[]> {
    let query = db.select().from(expenses).where(eq(expenses.userId, userId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate)
        )
      );
    }
    
    return await query.orderBy(desc(expenses.date), desc(expenses.createdAt));
  }

  async updateExpense(id: number, userId: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db
      .update(expenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: number, userId: string): Promise<void> {
    await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
  }

  // Analytics operations
  async getDashboardStats(userId: string): Promise<{
    todaySales: string;
    todayExpenses: string;
    thisWeekSales: string;
    thisWeekExpenses: string;
    expensesByCategory: Array<{ category: string; amount: string }>;
    salesTrend: Array<{ date: string; amount: string }>;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Today's sales
    const [todaySalesResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${sales.amount}), 0)` })
      .from(sales)
      .where(and(eq(sales.userId, userId), eq(sales.date, today)));

    // Today's expenses
    const [todayExpensesResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.date, today)));

    // This week's sales
    const [thisWeekSalesResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${sales.amount}), 0)` })
      .from(sales)
      .where(and(eq(sales.userId, userId), gte(sales.date, weekAgo)));

    // This week's expenses
    const [thisWeekExpensesResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), gte(expenses.date, weekAgo)));

    // Expenses by category
    const expensesByCategory = await db
      .select({
        category: expenses.type,
        amount: sql<string>`SUM(${expenses.amount})`,
      })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), gte(expenses.date, weekAgo)))
      .groupBy(expenses.type)
      .orderBy(sql`SUM(${expenses.amount}) DESC`)
      .limit(5);

    // Sales trend (last 7 days)
    const salesTrend = await db
      .select({
        date: sales.date,
        amount: sql<string>`SUM(${sales.amount})`,
      })
      .from(sales)
      .where(and(eq(sales.userId, userId), gte(sales.date, weekAgo)))
      .groupBy(sales.date)
      .orderBy(sales.date);

    return {
      todaySales: todaySalesResult?.total || '0',
      todayExpenses: todayExpensesResult?.total || '0',
      thisWeekSales: thisWeekSalesResult?.total || '0',
      thisWeekExpenses: thisWeekExpensesResult?.total || '0',
      expensesByCategory: expensesByCategory.map(item => ({
        category: item.category,
        amount: item.amount,
      })),
      salesTrend: salesTrend.map(item => ({
        date: item.date,
        amount: item.amount,
      })),
    };
  }
}

export const storage = new DatabaseStorage();

import { z } from "zod";

// Local storage types for client-side app
export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: number;
  userId: string;
  amount: string;
  category: string;
  date: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  userId: string;
  amount: string;
  type: string;
  date: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export const insertSaleSchema = z.object({
  amount: z.string(),
  category: z.string(),
  date: z.string(),
  notes: z.string().optional(),
});

export const insertExpenseSchema = z.object({
  amount: z.string(),
  type: z.string(),
  date: z.string(),
  description: z.string().optional(),
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type UpsertUser = Partial<User>;

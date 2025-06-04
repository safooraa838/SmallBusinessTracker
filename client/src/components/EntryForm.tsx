import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSaleSchema, insertExpenseSchema } from "@shared/schema";
import { DollarSign, Receipt } from "lucide-react";
import { z } from "zod";

type EntryType = 'sale' | 'expense';

const saleFormSchema = insertSaleSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

export default function EntryForm() {
  const [entryType, setEntryType] = useState<EntryType>('sale');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saleForm = useForm({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      amount: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const expenseForm = useForm({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: '',
      type: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/sales', {
        ...data,
        amount: parseFloat(data.amount).toString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Sale entry saved successfully!" });
      saleForm.reset({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save sale entry",
        variant: "destructive"
      });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/expenses', {
        ...data,
        amount: parseFloat(data.amount).toString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Expense entry saved successfully!" });
      expenseForm.reset({
        amount: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save expense entry",
        variant: "destructive"
      });
    },
  });

  const onSubmitSale = (data: any) => {
    createSaleMutation.mutate(data);
  };

  const onSubmitExpense = (data: any) => {
    createExpenseMutation.mutate(data);
  };

  const clearForm = () => {
    if (entryType === 'sale') {
      saleForm.reset({
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } else {
      expenseForm.reset({
        amount: '',
        type: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Entry</h2>
      
      <Card>
        <CardContent className="pt-6 pb-6 px-6">
          {/* Entry Type Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <Button
              type="button"
              variant={entryType === 'sale' ? 'default' : 'ghost'}
              className={`flex-1 ${entryType === 'sale' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setEntryType('sale')}
            >
              <DollarSign className="mr-2" size={16} />
              Sale
            </Button>
            <Button
              type="button"
              variant={entryType === 'expense' ? 'default' : 'ghost'}
              className={`flex-1 ${entryType === 'expense' ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setEntryType('expense')}
            >
              <Receipt className="mr-2" size={16} />
              Expense
            </Button>
          </div>

          {/* Sale Form */}
          {entryType === 'sale' && (
            <Form {...saleForm}>
              <form onSubmit={saleForm.handleSubmit(onSubmitSale)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={saleForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={saleForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={saleForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="retail">Retail Sales</SelectItem>
                          <SelectItem value="online">Online Sales</SelectItem>
                          <SelectItem value="service">Service Revenue</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={saleForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Add any additional details..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-4 mt-6">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary text-white hover:bg-blue-700"
                    disabled={createSaleMutation.isPending}
                  >
                    {createSaleMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                  <Button type="button" variant="outline" onClick={clearForm}>
                    Clear
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Expense Form */}
          {entryType === 'expense' && (
            <Form {...expenseForm}>
              <form onSubmit={expenseForm.handleSubmit(onSubmitExpense)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={expenseForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={expenseForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={expenseForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inventory">Inventory</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                          <SelectItem value="utilities">Utilities</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="supplies">Office Supplies</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={expenseForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Describe the expense..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex space-x-4 mt-6">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary text-white hover:bg-blue-700"
                    disabled={createExpenseMutation.isPending}
                  >
                    {createExpenseMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                  <Button type="button" variant="outline" onClick={clearForm}>
                    Clear
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

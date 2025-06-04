import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSaleSchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

interface Transaction {
  id: number;
  type: 'sale' | 'expense';
  amount: string;
  category: string;
  date: string;
  description: string | null;
}

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

const saleFormSchema = insertSaleSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

const expenseFormSchema = insertExpenseSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

export default function EditTransactionModal({ transaction, onClose }: EditTransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isSale = transaction.type === 'sale';
  const schema = isSale ? saleFormSchema : expenseFormSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: transaction.amount,
      date: transaction.date,
      ...(isSale ? {
        category: transaction.category,
        notes: transaction.description || '',
      } : {
        type: transaction.category,
        description: transaction.description || '',
      }),
    },
  });

  // Reset form when transaction changes
  useEffect(() => {
    form.reset({
      amount: transaction.amount,
      date: transaction.date,
      ...(isSale ? {
        category: transaction.category,
        notes: transaction.description || '',
      } : {
        type: transaction.category,
        description: transaction.description || '',
      }),
    });
  }, [transaction, form, isSale]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = isSale ? `/api/sales/${transaction.id}` : `/api/expenses/${transaction.id}`;
      const payload = {
        ...data,
        amount: parseFloat(data.amount).toString(),
      };
      
      const response = await apiRequest('PUT', endpoint, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transaction updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (isSale) {
        queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      }
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update transaction",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit {transaction.type === 'sale' ? 'Sale' : 'Expense'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
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

            {isSale ? (
              <>
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-primary text-white hover:bg-blue-700"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

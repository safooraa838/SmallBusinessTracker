import { useState } from "react";
import Navigation from "@/components/Navigation";
import SummaryCards from "@/components/SummaryCards";
import EntryForm from "@/components/EntryForm";
import TransactionsList from "@/components/TransactionsList";
import EditTransactionModal from "@/components/EditTransactionModal";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entries' | 'transactions'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <SummaryCards />}
        {activeTab === 'entries' && <EntryForm />}
        {activeTab === 'transactions' && (
          <TransactionsList onEditTransaction={setEditingTransaction} />
        )}
      </main>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}

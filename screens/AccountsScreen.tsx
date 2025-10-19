import React, { useState, useEffect, useCallback } from 'react';
import type { User, AccountTransaction } from '../types';
import { db } from '../services/db';
import { Modal } from '../components/Modal';
import { AccountsLedger } from '../components/AccountsLedger';
import { TransactionForm } from '../components/TransactionForm';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';

interface AccountsScreenProps {
  user: User;
}

const StatCard: React.FC<{ title: string; amount: number; color: string; }> = ({ title, amount, color }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
        <p className="text-3xl font-bold text-gray-800 mt-2">Rs {amount.toFixed(2)}</p>
    </div>
);

export const AccountsScreen: React.FC<AccountsScreenProps> = ({ user }) => {
    const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
    const [balances, setBalances] = useState({ clinicBalance: 0, ownerBalance: 0 });
    const [activeTab, setActiveTab] = useState<'clinic' | 'owner'>('clinic');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<AccountTransaction | null>(null);
    const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        const [trans, bals] = await Promise.all([
            db.getAccountTransactions(),
            db.getLatestBalances()
        ]);
        setTransactions(trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setBalances(bals);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddTransaction = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };
    
    const handleEditTransaction = (transaction: AccountTransaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };
    
    const handleSaveTransaction = async (data: any) => {
        await db.saveManualTransaction(data);
        fetchData();
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this manual transaction?")) {
            await db.deleteManualTransaction(id);
            fetchData();
        }
    };
    
    const calculateProfitLoss = () => {
        const income = transactions.reduce((acc, t) => t.clinicAmount > 0 ? acc + t.clinicAmount : acc, 0);
        const expense = transactions.reduce((acc, t) => t.clinicAmount < 0 ? acc + t.clinicAmount : acc, 0);
        return { income, expense, net: income + expense };
    };

    const { income, expense, net } = calculateProfitLoss();

    if (user.role !== 'admin') {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Access Denied: </strong>
            <span className="block sm:inline">You do not have permission to view this page.</span>
        </div>;
    }

    const renderClinicView = () => (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Income" amount={income} color="text-green-600" />
                <StatCard title="Total Expense" amount={Math.abs(expense)} color="text-red-600" />
                <StatCard title="Net Profit / Loss" amount={net} color={net >= 0 ? "text-green-600" : "text-red-600"} />
            </div>
            <AccountsLedger 
                accountType="clinic" 
                transactions={transactions} 
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onViewInvoice={setViewingInvoiceId}
            />
        </>
    );

    const renderOwnerView = () => (
        <>
            <AccountsLedger 
                accountType="owner" 
                transactions={transactions} 
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onViewInvoice={setViewingInvoiceId}
            />
        </>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Accounts</h1>
                <button
                    onClick={handleAddTransaction}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold"
                >
                    New Transaction / Transfer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Clinic Cash In Hand" amount={balances.clinicBalance} color="text-blue-600" />
                <StatCard title="My Pocket Cash" amount={balances.ownerBalance} color="text-purple-600" />
                <StatCard title="Total Cash In Hand" amount={balances.clinicBalance + balances.ownerBalance} color="text-gray-700" />
            </div>

            <div className="flex border-b mb-6">
                <button onClick={() => setActiveTab('clinic')} className={`px-4 py-2 text-lg font-medium ${activeTab === 'clinic' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Clinic Account
                </button>
                <button onClick={() => setActiveTab('owner')} className={`px-4 py-2 text-lg font-medium ${activeTab === 'owner' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    My Pocket
                </button>
            </div>

            {activeTab === 'clinic' ? renderClinicView() : renderOwnerView()}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTransaction ? "Edit Transaction" : "New Manual Transaction"}>
                <TransactionForm 
                    onSave={handleSaveTransaction} 
                    onCancel={() => setIsModalOpen(false)}
                    transaction={editingTransaction}
                />
            </Modal>
            
            {viewingInvoiceId && (
                <InvoiceDetailModal invoiceId={viewingInvoiceId} onClose={() => setViewingInvoiceId(null)} />
            )}
        </div>
    );
};
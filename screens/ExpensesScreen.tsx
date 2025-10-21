import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { Expense, User } from '../types';
import { Modal } from '../components/Modal';
import { ExpenseForm } from '../components/ExpenseForm';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';

export const ExpensesScreen: React.FC<{ user: User }> = ({ user }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [printingExpense, setPrintingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);

  const fetchExpenses = useCallback(async () => {
    const data = await db.getExpenses();
    setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    const results = expenses.filter(e => {
        const itemDate = new Date(e.date);
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (itemDate < start) return false;
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (itemDate > end) return false;
        }
        return true;
    });
    setFilteredExpenses(results);
  }, [startDate, endDate, expenses]);


  const handleAddExpense = () => {
    setEditingExpense({});
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await db.deleteExpense(id);
        fetchExpenses();
      } catch (error: any) {
        alert(`Error deleting expense: ${error.message}`);
      }
    }
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'> & { id?: string }) => {
    await db.saveExpense(expenseData);
    fetchExpenses();
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const expensesTableContent = (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left text-sm font-semibold text-gray-600">ID</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Date</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Category</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Description</th>
            <th className="p-3 text-right text-sm font-semibold text-gray-600">Amount</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 no-print-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
            <tr key={expense.id} className="border-b hover:bg-gray-50">
              <td className="p-3 text-sm text-gray-700 font-medium">{expense.id}</td>
              <td className="p-3 text-sm text-gray-700">{new Date(expense.date).toLocaleDateString()}</td>
              <td className="p-3 text-sm text-gray-700">{expense.category}</td>
              <td className="p-3 text-sm text-gray-700">{expense.description}</td>
              <td className="p-3 text-sm text-gray-700 text-right">Rs {expense.amount.toFixed(2)}</td>
              <td className="p-3 text-sm no-print-col">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setPrintingExpense(expense)} title="Print Expense" className="text-gray-600 hover:text-gray-800">
                        <PrinterIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleEditExpense(expense)} title="Edit Expense" className="text-blue-600 hover:text-blue-800">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    {user.role === 'admin' && (
                        <button onClick={() => handleDeleteExpense(expense.id)} title="Delete Expense" className="text-red-600 hover:text-red-800">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                  </div>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={6} className="p-3 text-center text-gray-500">No expenses recorded in this period.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
        <div className="flex items-center gap-2">
           <button
            onClick={() => setIsPreviewOpen(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Print List
          </button>
          <button
            onClick={handleAddExpense}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold"
          >
            Add Expense
          </button>
        </div>
      </div>

       <div className="mb-4 p-4 bg-gray-50 border rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4 items-center no-print">
            <label className="text-sm font-medium text-gray-700">Start Date:
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-1.5 border border-gray-300 rounded-md text-gray-900" />
            </label>
            <label className="text-sm font-medium text-gray-700">End Date:
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-1.5 border border-gray-300 rounded-md text-gray-900" />
            </label>
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm mt-4 sm:mt-0">Clear Dates</button>
        </div>

      {expensesTableContent}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingExpense(null); }} title={editingExpense?.id ? 'Edit Expense' : 'Add Expense'}>
        {editingExpense && <ExpenseForm expense={editingExpense} onSave={handleSaveExpense} onCancel={() => { setIsModalOpen(false); setEditingExpense(null); }} />}
      </Modal>
      
       <PrintPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Expenses List"
      >
        {expensesTableContent}
      </PrintPreviewModal>

      <PrintPreviewModal
        isOpen={!!printingExpense}
        onClose={() => setPrintingExpense(null)}
        title={`Expense Voucher #${printingExpense?.id}`}
      >
        {printingExpense && (
          <div className="text-sm p-4">
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <p><strong>Expense ID:</strong> {printingExpense.id}</p>
                    <p><strong>Category:</strong> {printingExpense.category}</p>
                </div>
                <div className="text-right">
                    <p><strong>Date:</strong> {new Date(printingExpense.date).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="mb-4">
                <p><strong>Description:</strong></p>
                <p>{printingExpense.description}</p>
            </div>
            <div className="text-center border-t border-b py-6 my-6">
                <p className="text-gray-600 uppercase tracking-wide">Total Amount</p>
                <p className="text-4xl font-bold tracking-tight">Rs {printingExpense.amount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </PrintPreviewModal>

    </div>
  );
};
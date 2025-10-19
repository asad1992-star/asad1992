import React, { useState, useEffect } from 'react';
import type { AccountTransaction } from '../types';

type TransactionType = 'ownerToClinic' | 'clinicToOwner' | 'personalSpending';

interface TransactionFormProps {
  transaction: AccountTransaction | null;
  onSave: (data: Omit<AccountTransaction, 'id' | 'clinicBalance' | 'ownerBalance' | 'referenceId'> & { id?: string }) => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ transaction, onSave, onCancel }) => {
    const [type, setType] = useState<TransactionType>('clinicToOwner');
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    const isEditing = !!transaction;

    useEffect(() => {
        if (transaction) {
            if (transaction.clinicAmount === 0 && transaction.ownerAmount < 0) {
                 setType('personalSpending');
            } else {
                const isWithdrawal = transaction.clinicAmount < 0 && transaction.ownerAmount > 0;
                setType(isWithdrawal ? 'clinicToOwner' : 'ownerToClinic');
            }
            setAmount(Math.abs(transaction.clinicAmount || transaction.ownerAmount));
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
            setDescription(transaction.description);
        } else {
            // Reset form for new entry
            setType('clinicToOwner');
            setAmount(0);
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
        }
    }, [transaction]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || !description) {
            alert('Please enter a valid amount and description.');
            return;
        }

        let clinicAmount = 0;
        let ownerAmount = 0;

        if (type === 'clinicToOwner') {
            clinicAmount = -amount;
            ownerAmount = amount;
        } else if (type === 'ownerToClinic') { // ownerToClinic
            clinicAmount = amount;
            ownerAmount = -amount;
        } else { // personalSpending
            clinicAmount = 0;
            ownerAmount = -amount;
        }
        
        onSave({
            id: transaction?.id,
            date,
            description,
            clinicAmount,
            ownerAmount,
            isManual: true,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                <select
                    value={type}
                    onChange={e => setType(e.target.value as TransactionType)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900"
                    disabled={isEditing}
                >
                    <option value="clinicToOwner">Withdraw from Clinic (For Personal Use)</option>
                    <option value="ownerToClinic">Invest in Clinic (From Pocket)</option>
                    <option value="personalSpending">Personal Spending (from My Pocket)</option>
                </select>
                 {isEditing && <p className="text-xs text-gray-500 mt-1">Transaction type cannot be changed.</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900"
                    required min="0.01" step="0.01"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900"
                    required
                />
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{isEditing ? 'Update' : 'Save'} Transaction</button>
            </div>
        </form>
    );
};
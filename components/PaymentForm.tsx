import React, { useState, useEffect } from 'react';
import type { Customer, Supplier, Payment } from '../types';
import { AutocompleteSearch } from './AutocompleteSearch';
import { db } from '../services/db';

interface PaymentFormProps {
  paymentType: 'receive' | 'pay';
  onSave: (payment: Omit<Payment, 'id'>) => void;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ paymentType, onSave, onCancel }) => {
  const [parties, setParties] = useState<(Customer | Supplier)[]>([]);
  const [selectedParty, setSelectedParty] = useState<Customer | Supplier | null>(null);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    async function fetchParties() {
      if (paymentType === 'receive') {
        const customers = await db.getCustomers();
        setParties(customers.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        const suppliers = await db.getSuppliers();
        setParties(suppliers.sort((a, b) => a.name.localeCompare(b.name)));
      }
    }
    fetchParties();
  }, [paymentType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || amount <= 0) {
      alert('Please select a party and enter a valid amount.');
      return;
    }
    onSave({
      type: paymentType,
      partyId: selectedParty.id,
      amount,
      date,
    });
  };

  const partyLabel = paymentType === 'receive' ? 'Customer' : 'Supplier';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{partyLabel}</label>
        <AutocompleteSearch<Customer | Supplier>
          placeholder={`Search ${partyLabel}...`}
          items={parties}
          filterFn={(p, query) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.phone.includes(query) ||
            p.id.toLowerCase().includes(query.toLowerCase())
          }
          displayFn={(p) => `${p.name} (Balance: Rs ${p.outstandingBalance.toFixed(2)})`}
          onSelect={setSelectedParty}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          required
          min="0.01"
          step="0.01"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          required
        />
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Payment
        </button>
      </div>
    </form>
  );
};

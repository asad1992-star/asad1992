import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { Customer, User } from '../types';
import { Modal } from '../components/Modal';
import { CustomerForm } from '../components/CustomerForm';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { CustomerHistoryView } from '../components/CustomerHistoryView';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { eventBus } from '../services/eventBus';

interface CustomersScreenProps {
  user: User;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({ user }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const fetchCustomers = useCallback(async () => {
    const data = await db.getCustomers();
    setCustomers(data);
  }, []);

  useEffect(() => {
    fetchCustomers();
    eventBus.on('data-changed', fetchCustomers);
    return () => eventBus.off('data-changed', fetchCustomers);
  }, [fetchCustomers]);

  useEffect(() => {
    const results = customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.id.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
    setFilteredCustomers(results);
  }, [search, customers]);

  const handleAddCustomer = () => {
    setEditingCustomer({});
    setIsModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };
  
  const handleDeleteCustomer = async (customer: Customer) => {
      if (customer.outstandingBalance !== 0) {
          alert("Cannot delete customer with an outstanding balance. Please clear the balance first.");
          return;
      }
      if (window.confirm(`Are you sure you want to delete ${customer.name}? This action cannot be undone.`)) {
          try {
            await db.deleteCustomer(customer.id);
            fetchCustomers();
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
      }
  }

  // FIX: Aligned type with db.saveCustomer to resolve type error.
  const handleSaveCustomer = async (customerData: Omit<Customer, 'outstandingBalance'> & { id?: string }) => {
    await db.saveCustomer(customerData);
    fetchCustomers();
    setIsModalOpen(false);
    setEditingCustomer(null);
  };
  
  const handleViewHistory = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  const customerTableContent = (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Code</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Name</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Phone</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">Balance</th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 no-print-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
            <tr key={customer.id} className="border-b hover:bg-gray-50">
              <td className="p-3 text-sm text-gray-700">{customer.id}</td>
              <td className="p-3 text-sm text-gray-700 font-medium">{customer.name}</td>
              <td className="p-3 text-sm text-gray-700">{customer.phone}</td>
              <td className="p-3 text-sm text-gray-700">
                <button onClick={() => handleViewHistory(customer)} className="text-blue-600 hover:underline font-semibold">
                  Rs {customer.outstandingBalance.toFixed(2)}
                </button>
              </td>
              <td className="p-3 text-sm no-print-col">
                <div className="flex items-center gap-4">
                  <button onClick={() => handleViewHistory(customer)} title="Print History" className="text-gray-600 hover:text-gray-800">
                    <PrinterIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleEditCustomer(customer)} className="text-blue-500 hover:underline">Edit</button>
                  {user.role === 'admin' && <button onClick={() => handleDeleteCustomer(customer)} className="text-red-500 hover:underline">Delete</button>}
                </div>
              </td>
            </tr>
          )) : (
              <tr>
                  <td colSpan={5} className="p-3 text-center text-gray-500">No customers found.</td>
              </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
        <div className="flex items-center gap-2">
           <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Print List
          </button>
          <button
            onClick={handleAddCustomer}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold"
          >
            Add Customer
          </button>
        </div>
      </div>

      <div className="mb-4 no-print">
        <input
          type="text"
          placeholder="Search by name, phone, or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
        />
      </div>

      {customerTableContent}
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer?.id ? 'Edit Customer' : 'Add Customer'}>
        {editingCustomer && <CustomerForm onSave={handleSaveCustomer} onCancel={() => setIsModalOpen(false)} customer={editingCustomer} />}
      </Modal>

      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title={`History for ${viewingCustomer?.name}`} size="4xl" wrapperClassName='customer-history-modal'>
        {viewingCustomer && <CustomerHistoryView customer={viewingCustomer} />}
      </Modal>

      <PrintPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Customer List"
      >
        {customerTableContent}
      </PrintPreviewModal>
    </div>
  );
};
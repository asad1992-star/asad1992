import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { Supplier, User } from '../types';
import { Modal } from '../components/Modal';
import { SupplierForm } from '../components/SupplierForm';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { SupplierHistoryView } from '../components/SupplierHistoryView';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { eventBus } from '../services/eventBus';


interface SuppliersScreenProps {
  user: User;
}

export const SuppliersScreen: React.FC<SuppliersScreenProps> = ({ user }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const fetchSuppliers = useCallback(async () => {
    const data = await db.getSuppliers();
    setSuppliers(data);
  }, []);

  useEffect(() => {
    fetchSuppliers();
    eventBus.on('data-changed', fetchSuppliers);
    return () => eventBus.off('data-changed', fetchSuppliers);
  }, [fetchSuppliers]);

  useEffect(() => {
    const results = suppliers.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.id.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
    setFilteredSuppliers(results);
  }, [search, suppliers]);

  const handleAddSupplier = () => {
    setEditingSupplier({});
    setIsModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };
  
  const handleDeleteSupplier = async (supplier: Supplier) => {
      if (supplier.outstandingBalance !== 0) {
          alert("Cannot delete supplier with an outstanding balance. Please clear the balance first.");
          return;
      }
      if (window.confirm(`Are you sure you want to delete ${supplier.name}? This action cannot be undone.`)) {
          try {
            await db.deleteSupplier(supplier.id);
            fetchSuppliers();
          } catch (error: any) {
            alert(`Error: ${error.message}`);
          }
      }
  }

  // FIX: Aligned type with db.saveSupplier to resolve type error.
  const handleSaveSupplier = async (supplierData: Omit<Supplier, 'outstandingBalance'> & { id?: string }) => {
    await db.saveSupplier(supplierData);
    fetchSuppliers();
    setIsModalOpen(false);
    setEditingSupplier(null);
  };
  
  const handleViewHistory = (supplier: Supplier) => {
    setViewingSupplier(supplier);
  };

  const handlePrint = () => {
    setIsPreviewOpen(true);
  };

  const supplierTableContent = (
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
            {filteredSuppliers.length > 0 ? filteredSuppliers.map(supplier => (
              <tr key={supplier.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-700">{supplier.id}</td>
                <td className="p-3 text-sm text-gray-700 font-medium">{supplier.name}</td>
                <td className="p-3 text-sm text-gray-700">{supplier.phone}</td>
                <td className="p-3 text-sm text-gray-700">
                   <button onClick={() => handleViewHistory(supplier)} className="text-blue-600 hover:underline font-semibold">
                    Rs {supplier.outstandingBalance.toFixed(2)}
                  </button>
                </td>
                <td className="p-3 text-sm no-print-col">
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleViewHistory(supplier)} title="Print History" className="text-gray-600 hover:text-gray-800">
                      <PrinterIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleEditSupplier(supplier)} className="text-blue-500 hover:underline">Edit</button>
                    {user.role === 'admin' && <button onClick={() => handleDeleteSupplier(supplier)} className="text-red-500 hover:underline">Delete</button>}
                  </div>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="p-3 text-center text-gray-500">No suppliers found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Suppliers</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Print List
          </button>
          <button
            onClick={handleAddSupplier}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold"
          >
            Add Supplier
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

      {supplierTableContent}
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier?.id ? 'Edit Supplier' : 'Add Supplier'}>
        {editingSupplier && <SupplierForm onSave={handleSaveSupplier} onCancel={() => setIsModalOpen(false)} supplier={editingSupplier} />}
      </Modal>

      <Modal isOpen={!!viewingSupplier} onClose={() => setViewingSupplier(null)} title={`History for ${viewingSupplier?.name}`} size="4xl" wrapperClassName="supplier-history-modal">
        {viewingSupplier && <SupplierHistoryView supplier={viewingSupplier} />}
      </Modal>

       <PrintPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        title="Supplier List"
      >
        {supplierTableContent}
      </PrintPreviewModal>
    </div>
  );
};
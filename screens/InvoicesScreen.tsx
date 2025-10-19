import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { Invoice, User, Customer, Supplier, Product } from '../types';
import { Modal } from '../components/Modal';
import { InvoiceForm } from '../components/InvoiceForm';
import { TrashIcon } from '../components/icons/TrashIcon';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { eventBus } from '../services/eventBus';

export const InvoicesScreen: React.FC<{ user: User }> = ({ user }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [invoiceType, setInvoiceType] = useState<'treatment' | 'sale' | 'purchase' | null>(null);
    const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const fetchData = useCallback(async () => {
        const invoiceData = await db.getInvoices();
        setInvoices(invoiceData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setCustomers(await db.getCustomers());
        setSuppliers(await db.getSuppliers());
        setProducts(await db.getProducts());
    }, []);

    useEffect(() => {
        fetchData();
        eventBus.on('data-changed', fetchData);
        return () => eventBus.off('data-changed', fetchData);
    }, [fetchData]);

    useEffect(() => {
        const results = invoices.filter(i => {
            const matchesSearch = i.id.toLowerCase().includes(search.toLowerCase()) ||
                                getPartyName(i).toLowerCase().includes(search.toLowerCase());
            
            if (!matchesSearch) return false;

            const itemDate = new Date(i.date);
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
        setFilteredInvoices(results);
    }, [search, startDate, endDate, invoices, customers, suppliers]);

    const handleNewInvoice = (type: 'treatment' | 'sale' | 'purchase') => {
        setInvoiceType(type);
        setIsFormModalOpen(true);
    };

    const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
        try {
            await db.saveInvoice(invoiceData);
            fetchData();
            eventBus.dispatch('data-changed'); // Notify other screens
            setIsFormModalOpen(false);
            setInvoiceType(null);
        } catch (error: any) {
            alert(`Failed to save invoice: ${error.message}`);
        }
    };
    
    const handleDeleteInvoice = async (invoiceId: string) => {
        if (window.confirm(`Are you sure you want to delete invoice ${invoiceId}? This will revert stock and balance changes.`)) {
            await db.deleteInvoice(invoiceId);
            fetchData();
            eventBus.dispatch('data-changed');
        }
    }

    const getPartyName = (invoice: Invoice): string => {
        if (invoice.customerId) {
            return customers.find(c => c.id === invoice.customerId)?.name || invoice.customerId;
        }
        if (invoice.supplierId) {
            return suppliers.find(s => s.id === invoice.supplierId)?.name || invoice.supplierId;
        }
        return 'N/A';
    }

    const getStatusColor = (status: Invoice['paymentStatus']) => {
        switch(status) {
            case 'Fully Paid': return 'bg-green-100 text-green-800';
            case 'Partially Paid': return 'bg-yellow-100 text-yellow-800';
            case 'Credit': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    const invoiceTableContent = (
         <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-max">
                <thead>
                    <tr className="border-b">
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Code</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Type</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Customer/Supplier</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Date</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Total</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600 no-print-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => (
                        <tr key={invoice.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-sm text-gray-700 font-medium">
                                <button onClick={() => setViewingInvoiceId(invoice.id)} className="text-blue-600 hover:underline">
                                    {invoice.id}
                                </button>
                            </td>
                            <td className="p-3 text-sm text-gray-700 capitalize">{invoice.type}</td>
                            <td className="p-3 text-sm text-gray-700">{getPartyName(invoice)}</td>
                            <td className="p-3 text-sm text-gray-700">{new Date(invoice.date).toLocaleDateString()}</td>
                            <td className="p-3 text-sm text-gray-700">Rs {invoice.totalAmount.toFixed(2)}</td>
                            <td className="p-3 text-sm text-gray-700">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.paymentStatus)}`}>
                                    {invoice.paymentStatus}
                                </span>
                            </td>
                            <td className="p-3 text-sm no-print-col">
                              <div className="flex items-center gap-4">
                                <button onClick={() => setViewingInvoiceId(invoice.id)} title="Print Invoice" className="text-gray-600 hover:text-gray-800">
                                    <PrinterIcon className="h-5 w-5" />
                                </button>
                                {user.role === 'admin' && (
                                    <button onClick={() => handleDeleteInvoice(invoice.id)} className="text-red-600 hover:text-red-800">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                              </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={7} className="p-3 text-center text-gray-500">No invoices found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPreviewOpen(true)} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold flex items-center gap-2">
                        <PrinterIcon className="h-5 w-5" />
                        Print List
                    </button>
                    <button onClick={() => handleNewInvoice('treatment')} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">New Treatment</button>
                    <button onClick={() => handleNewInvoice('sale')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold">New Sale</button>
                    <button onClick={() => handleNewInvoice('purchase')} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 font-semibold">New Purchase</button>
                </div>
            </div>

            <div className="mb-4 p-4 bg-gray-50 border rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
                <input
                    type="text"
                    placeholder="Search by invoice code or party name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="md:col-span-1 w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                />
                 <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                    <label className="text-sm font-medium text-gray-700">Start Date:
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-1.5 border border-gray-300 rounded-md text-gray-900" />
                    </label>
                    <label className="text-sm font-medium text-gray-700">End Date:
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-1.5 border border-gray-300 rounded-md text-gray-900" />
                    </label>
                    <button onClick={() => { setStartDate(''); setEndDate(''); }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm mt-4 sm:mt-0">Clear Dates</button>
                </div>
            </div>

            {invoiceTableContent}

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={`New ${invoiceType} Invoice`} size="6xl">
                {invoiceType && <InvoiceForm onSave={handleSaveInvoice} onCancel={() => setIsFormModalOpen(false)} invoiceType={invoiceType} customers={customers} suppliers={suppliers} products={products} />}
            </Modal>
            
            {viewingInvoiceId && (
                <InvoiceDetailModal invoiceId={viewingInvoiceId} onClose={() => setViewingInvoiceId(null)} />
            )}
            
            <PrintPreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
                title="Invoice List"
            >
                {invoiceTableContent}
            </PrintPreviewModal>
        </div>
    );
};
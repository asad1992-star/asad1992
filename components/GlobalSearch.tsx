
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { SearchResult, Product, Customer, Supplier, Invoice, InvoiceWithDetails } from '../types';

interface GlobalSearchProps {
    onViewProduct: (product: Product) => void;
    onViewCustomer: (customer: Customer) => void;
    onViewSupplier: (supplier: Supplier) => void;
    onViewInvoice: (invoiceId: string) => void;
}

const ProductResult: React.FC<{ product: Product; onView: () => void }> = ({ product, onView }) => (
    <div onClick={onView} className="p-4 border-b hover:bg-gray-100 cursor-pointer transition-colors duration-150">
        <div className="flex justify-between items-center">
            <p className="font-bold text-blue-600">{product.name} <span className="text-sm font-normal text-gray-500">({product.id})</span></p>
            <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Product</span>
        </div>
        <div className="text-sm text-gray-600 mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
            <p><strong>Location:</strong> {product.location || 'N/A'}</p>
            <p><strong>Stock:</strong> {product.stockVials} ({product.packingUnit})</p>
            <p><strong>Loose:</strong> {product.stockLoose} {product.looseUnit}</p>
            <p><strong>Sale Price:</strong> Rs {product.salePrice.toFixed(2)}</p>
            <p><strong>Latest Purchase:</strong> Rs {product.latestPurchasePrice.toFixed(2)}</p>
            <p><strong>Expiry:</strong> {new Date(product.expiryDate).toLocaleDateString()}</p>
        </div>
    </div>
);

const CustomerResult: React.FC<{ customer: Customer; onView: () => void }> = ({ customer, onView }) => (
    <div onClick={onView} className="p-4 border-b hover:bg-gray-100 cursor-pointer transition-colors duration-150">
        <div className="flex justify-between items-center">
            <p className="font-bold text-green-600">{customer.name} <span className="text-sm font-normal text-gray-500">({customer.id})</span></p>
            <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Customer</span>
        </div>
        <div className="text-sm text-gray-600 mt-2 flex justify-between">
            <p><strong>Phone:</strong> {customer.phone}</p>
            <p><strong>Balance:</strong> Rs {customer.outstandingBalance.toFixed(2)}</p>
        </div>
    </div>
);

const SupplierResult: React.FC<{ supplier: Supplier; onView: () => void }> = ({ supplier, onView }) => (
    <div onClick={onView} className="p-4 border-b hover:bg-gray-100 cursor-pointer transition-colors duration-150">
        <div className="flex justify-between items-center">
            <p className="font-bold text-purple-600">{supplier.name} <span className="text-sm font-normal text-gray-500">({supplier.id})</span></p>
            <span className="text-xs font-semibold bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Supplier</span>
        </div>
        <div className="text-sm text-gray-600 mt-2 flex justify-between">
            <p><strong>Phone:</strong> {supplier.phone}</p>
            <p><strong>Balance:</strong> Rs {supplier.outstandingBalance.toFixed(2)}</p>
        </div>
    </div>
);

const InvoiceResult: React.FC<{ invoice: InvoiceWithDetails; onView: () => void }> = ({ invoice, onView }) => {
    const partyName = invoice.customer?.name || invoice.supplier?.name || 'N/A';
    const getStatusColor = (status: Invoice['paymentStatus']) => {
        switch(status) {
            case 'Fully Paid': return 'bg-green-100 text-green-800';
            case 'Partially Paid': return 'bg-yellow-100 text-yellow-800';
            case 'Credit': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (
        <div onClick={onView} className="p-4 border-b hover:bg-gray-100 cursor-pointer transition-colors duration-150">
            <div className="flex justify-between items-center">
                <p className="font-bold text-orange-600">{invoice.id} <span className="text-sm font-normal text-gray-500">({partyName})</span></p>
                <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-1 rounded-full capitalize">{invoice.type} Invoice</span>
            </div>
            <div className="text-sm text-gray-600 mt-2 flex justify-between items-center">
                <p><strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}</p>
                <p><strong>Total:</strong> Rs {invoice.totalAmount.toFixed(2)}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.paymentStatus)}`}>
                    {invoice.paymentStatus}
                </span>
            </div>
        </div>
    );
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onViewProduct, onViewCustomer, onViewSupplier, onViewInvoice }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const performSearch = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            setHasSearched(q.length > 0);
            return;
        }
        setIsLoading(true);
        setHasSearched(true);

        const [products, customers, suppliers, invoices] = await Promise.all([
            db.getProducts(),
            db.getCustomers(),
            db.getSuppliers(),
            db.getInvoices(),
        ]);

        const customerMap = new Map(customers.map(c => [c.id, c]));
        const supplierMap = new Map(suppliers.map(s => [s.id, s]));

        const lowerCaseQuery = q.toLowerCase();

        const productResults: SearchResult[] = products
            .filter(p => p.name.toLowerCase().includes(lowerCaseQuery) || p.id.toLowerCase().includes(lowerCaseQuery))
            .map(p => ({ ...p, resultType: 'Product' }));

        const customerResults: SearchResult[] = customers
            .filter(c => c.name.toLowerCase().includes(lowerCaseQuery) || c.id.toLowerCase().includes(lowerCaseQuery) || c.phone.includes(q))
            .map(c => ({ ...c, resultType: 'Customer' }));

        const supplierResults: SearchResult[] = suppliers
            .filter(s => s.name.toLowerCase().includes(lowerCaseQuery) || s.id.toLowerCase().includes(lowerCaseQuery) || s.phone.includes(q))
            .map(s => ({ ...s, resultType: 'Supplier' }));

        const invoiceResults: SearchResult[] = invoices
            .filter(i => {
                // FIX: Refactored party name logic to be safer and avoid potential runtime errors.
                let partyName = '';
                if (i.customerId) {
                    partyName = customerMap.get(i.customerId)?.name || '';
                } else if (i.supplierId) {
                    partyName = supplierMap.get(i.supplierId)?.name || '';
                }
                return i.id.toLowerCase().includes(lowerCaseQuery) || (partyName && partyName.toLowerCase().includes(lowerCaseQuery));
            })
            .map(i => ({ 
                ...i, 
                customer: i.customerId ? customerMap.get(i.customerId) : undefined, 
                supplier: i.supplierId ? supplierMap.get(i.supplierId) : undefined, 
                resultType: 'Invoice' 
            }));

        setResults([...productResults, ...customerResults, ...supplierResults, ...invoiceResults]);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(query);
        }, 300); // 300ms debounce

        return () => clearTimeout(handler);
    }, [query, performSearch]);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Global Search</h2>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search anything (products, customers, invoices...)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="mt-4 min-h-[10rem] bg-gray-50 rounded-lg border">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40"><p>Searching...</p></div>
                ) : hasSearched && results.length === 0 ? (
                    <div className="flex items-center justify-center h-40"><p>No results found for "{query}".</p></div>
                ) : !hasSearched ? (
                     <div className="flex items-center justify-center h-40 text-gray-500"><p>Enter a search term to begin.</p></div>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto">
                        {results.map((result) => {
                            switch (result.resultType) {
                                case 'Product':
                                    return <ProductResult key={`prod-${result.id}`} product={result} onView={() => onViewProduct(result)} />;
                                case 'Customer':
                                    return <CustomerResult key={`cust-${result.id}`} customer={result} onView={() => onViewCustomer(result)} />;
                                case 'Supplier':
                                    return <SupplierResult key={`supp-${result.id}`} supplier={result} onView={() => onViewSupplier(result)} />;
                                case 'Invoice':
                                    return <InvoiceResult key={`inv-${result.id}`} invoice={result as InvoiceWithDetails} onView={() => onViewInvoice(result.id)} />;
                                default:
                                    return null;
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

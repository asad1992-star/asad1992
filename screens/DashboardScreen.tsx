import React, { useState, useEffect } from 'react';
import type { User, Product, Customer, Supplier } from '../types';
import { db } from '../services/db';
import { GlobalSearch } from '../components/GlobalSearch';
import { Modal } from '../components/Modal';
import { ProductHistoryView } from '../components/ProductHistoryView';
import { CustomerHistoryView } from '../components/CustomerHistoryView';
import { SupplierHistoryView } from '../components/SupplierHistoryView';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { BackupStatusCard } from '../components/BackupStatusCard';

interface DashboardScreenProps {
  user: User;
}

const StatCard: React.FC<{ title: string; count: number; color: string }> = ({ title, count, color }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h2 className={`text-lg font-semibold ${color}`}>{title}</h2>
        <p className="text-3xl font-bold text-gray-800 mt-2">{count}</p>
        <p className="text-gray-500 mt-1">items</p>
    </div>
);


export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user }) => {
  const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
  const [expiringItems, setExpiringItems] = useState<Product[]>([]);
  const [expiryAlertDays] = useState(30); // Could be made a user setting

  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      const products = await db.getProducts();
      
      // Low stock
      const lowStock = products.filter(p => p.stockVials <= p.lowStockAlert);
      setLowStockItems(lowStock);

      // Expiry alerts
      const today = new Date();
      const alertDate = new Date();
      alertDate.setDate(today.getDate() + expiryAlertDays);
      
      const expiring = products.filter(p => {
        const expiry = new Date(p.expiryDate);
        return expiry <= alertDate && expiry >= today;
      });
      setExpiringItems(expiring);
    };

    fetchData();
  }, [expiryAlertDays]);
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="mb-8">
        <GlobalSearch 
            onViewProduct={setViewingProduct}
            onViewCustomer={setViewingCustomer}
            onViewSupplier={setViewingSupplier}
            onViewInvoice={setViewingInvoiceId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Low Stock Alerts" count={lowStockItems.length} color="text-yellow-600" />
        <StatCard title="Expiry Alerts" count={expiringItems.length} color="text-red-600" />
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-blue-600">Payment Reminders</h2>
          <p className="text-3xl font-bold text-gray-800 mt-2">0</p>
          <p className="text-gray-500 mt-1">pending</p>
        </div>
        <BackupStatusCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Low Stock Items</h2>
          {lowStockItems.length > 0 ? (
            <ul className="space-y-2">
              {lowStockItems.map(item => (
                <li key={item.id} className="text-sm text-gray-600 flex justify-between">
                  <span>{item.name} ({item.id})</span>
                  <span className="font-semibold">{item.stockVials} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-2">No low stock items.</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Items Expiring Soon (Next {expiryAlertDays} days)</h2>
          {expiringItems.length > 0 ? (
            <ul className="space-y-2">
              {expiringItems.map(item => (
                <li key={item.id} className="text-sm text-gray-600 flex justify-between">
                  <span>{item.name} ({item.id})</span>
                  <span className="font-semibold">{new Date(item.expiryDate).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-2">No items nearing expiry.</p>
          )}
        </div>
      </div>
      
      {/* Modals for viewing search result details */}
      <Modal isOpen={!!viewingProduct} onClose={() => setViewingProduct(null)} title={`History for ${viewingProduct?.name}`} size="4xl" wrapperClassName="product-history-modal">
        {viewingProduct && <ProductHistoryView product={viewingProduct} />}
      </Modal>
      <Modal isOpen={!!viewingCustomer} onClose={() => setViewingCustomer(null)} title={`History for ${viewingCustomer?.name}`} size="4xl" wrapperClassName="customer-history-modal">
        {viewingCustomer && <CustomerHistoryView customer={viewingCustomer} />}
      </Modal>
      <Modal isOpen={!!viewingSupplier} onClose={() => setViewingSupplier(null)} title={`History for ${viewingSupplier?.name}`} size="4xl" wrapperClassName="supplier-history-modal">
        {viewingSupplier && <SupplierHistoryView supplier={viewingSupplier} />}
      </Modal>
      {viewingInvoiceId && (
          <InvoiceDetailModal invoiceId={viewingInvoiceId} onClose={() => setViewingInvoiceId(null)} />
      )}
    </div>
  );
};
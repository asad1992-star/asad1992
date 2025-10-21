import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { Supplier, PartyHistory, Invoice, Payment } from '../types';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { PrintLayout } from './PrintLayout';
import { PrinterIcon } from './icons/PrinterIcon';
import { SupplierLedgerView } from './SupplierLedgerView';


interface SupplierHistoryViewProps {
  supplier: Supplier;
}

const InvoicesTable: React.FC<{invoices: Invoice[], onViewInvoice: (id: string) => void}> = ({ invoices, onViewInvoice }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Purchase Invoices</h3>
        <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="w-full min-w-max text-sm">
                <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b">
                        <th className="p-2 text-left font-semibold text-gray-600">Date</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Invoice ID</th>
                        <th className="p-2 text-right font-semibold text-gray-600">Total</th>
                        <th className="p-2 text-right font-semibold text-gray-600">Paid</th>
                        <th className="p-2 text-right font-semibold text-gray-600">Balance</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {invoices.length > 0 ? invoices.map((invoice) => (
                        <tr key={invoice.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{new Date(invoice.date).toLocaleDateString()}</td>
                            <td className="p-2">
                                <button onClick={() => onViewInvoice(invoice.id)} className="text-blue-600 hover:underline">
                                    {invoice.id}
                                </button>
                            </td>
                            <td className="p-2 text-right">{typeof invoice.totalAmount === 'number' ? invoice.totalAmount.toFixed(2) : 'N/A'}</td>
                            <td className="p-2 text-right">{typeof invoice.amountPaid === 'number' ? invoice.amountPaid.toFixed(2) : 'N/A'}</td>
                            <td className="p-2 text-right font-medium">
                                {(typeof invoice.totalAmount === 'number' && typeof invoice.amountPaid === 'number')
                                ? (invoice.totalAmount - invoice.amountPaid).toFixed(2)
                                : 'N/A'}
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-500">No invoices found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const PaymentsTable: React.FC<{payments: Payment[]}> = ({ payments }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Payments Made</h3>
        <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="w-full min-w-max text-sm">
                <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b">
                        <th className="p-2 text-left font-semibold text-gray-600">Date</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Payment ID</th>
                        <th className="p-2 text-right font-semibold text-gray-600">Amount</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {payments.length > 0 ? payments.map((payment) => (
                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">{new Date(payment.date).toLocaleDateString()}</td>
                            <td className="p-2">PAY-{payment.id}</td>
                            <td className="p-2 text-right font-medium">{typeof payment.amount === 'number' ? payment.amount.toFixed(2) : 'N/A'}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-500">No standalone payments found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

export const SupplierHistoryView: React.FC<SupplierHistoryViewProps> = ({ supplier }) => {
  const [history, setHistory] = useState<PartyHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'ledger'>('history');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      const data = await db.getSupplierHistory(supplier.id, { startDate, endDate });
      setHistory(data);
      setLoading(false);
    }
    if (activeTab === 'history') {
        loadHistory();
    }
  }, [supplier.id, startDate, endDate, activeTab]);
  
  const handlePrint = () => {
    window.print();
  };

  const renderContent = () => {
      if(activeTab === 'ledger') {
          return <SupplierLedgerView supplier={supplier} startDate={startDate} endDate={endDate} />;
      }

      if (loading) return <div className="text-center p-4">Loading history...</div>;
      if (!history) return <div className="text-center p-4 text-red-500">Could not load history.</div>;

      return (
        <div className="space-y-6">
            <InvoicesTable invoices={history.invoices || []} onViewInvoice={setViewingInvoiceId} />
            <PaymentsTable payments={history.payments || []} />
        </div>
      );
  }


  return (
    <>
      <div className="print-only printable-area">
          <PrintLayout title={`History for ${supplier.name}`}>
            {renderContent()}
          </PrintLayout>
      </div>

      <div className="no-print">
        <div className="flex border-b mb-4">
            <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>History</button>
            <button onClick={() => setActiveTab('ledger')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'ledger' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Ledger</button>
        </div>
         <div className="p-2 mb-4 bg-gray-50 border rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <label className="text-xs font-medium text-gray-700">Start Date:
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-gray-900 text-sm" />
              </label>
              <label className="text-xs font-medium text-gray-700">End Date:
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded-md text-gray-900 text-sm" />
              </label>
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-300 text-xs mt-3 sm:mt-0">Clear Dates</button>
          </div>
        <div className="max-h-[50vh] overflow-y-auto">
            {renderContent()}
        </div>
        <div className="pt-4 mt-4 border-t flex justify-end">
            <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
            <PrinterIcon className="h-5 w-5" />
            Print History
            </button>
        </div>
      </div>

      {viewingInvoiceId && (
          <InvoiceDetailModal invoiceId={viewingInvoiceId} onClose={() => setViewingInvoiceId(null)} />
      )}
    </>
  );
};
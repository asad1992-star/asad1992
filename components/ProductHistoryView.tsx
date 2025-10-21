
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { Product, ProductHistoryEntry } from '../types';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { PrintLayout } from './PrintLayout';
import { PrinterIcon } from './icons/PrinterIcon';

interface ProductHistoryViewProps {
  product: Product;
}

const HistoryTable: React.FC<{title: string, data: ProductHistoryEntry[], onViewInvoice: (id: string) => void}> = ({title, data, onViewInvoice}) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <div className="max-h-64 overflow-y-auto border rounded-lg">
            <table className="w-full min-w-max text-sm">
                <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b">
                        <th className="p-2 text-left font-semibold text-gray-600">Date</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Invoice ID</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Type</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Party</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Qty</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Price</th>
                        <th className="p-2 text-left font-semibold text-gray-600">Total</th>
                    </tr>
                </thead>
                <tbody className="bg-white">
                    {data.length > 0 ? data.map((entry, index) => (
                        <tr key={`${entry.invoiceId}-${index}`} className="border-b hover:bg-gray-50">
                            <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                            <td className="p-2">
                                <button onClick={() => onViewInvoice(entry.invoiceId)} className="text-blue-600 hover:underline">
                                    {entry.invoiceId}
                                </button>
                            </td>
                            <td className="p-2 capitalize">{entry.type}</td>
                            <td className="p-2">{entry.partyName}</td>
                            <td className="p-2">{typeof entry.quantity === 'number' ? entry.quantity.toFixed(2) : 'N/A'}</td>
                            <td className="p-2">{typeof entry.unitPrice === 'number' ? entry.unitPrice.toFixed(2) : 'N/A'}</td>
                            <td className="p-2 font-medium">{typeof entry.total === 'number' ? entry.total.toFixed(2) : 'N/A'}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={7} className="p-4 text-center text-gray-500">No records found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
)

export const ProductHistoryView: React.FC<ProductHistoryViewProps> = ({ product }) => {
  const [history, setHistory] = useState<{ purchases: ProductHistoryEntry[], sales: ProductHistoryEntry[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      const data = await db.getProductHistory(product.id);
      setHistory(data);
      setLoading(false);
    }
    loadHistory();
  }, [product.id]);
  
  const handlePrint = () => {
    const modalWrapper = document.querySelector('.product-history-modal');
    if (!modalWrapper) return;

    const handleAfterPrint = () => {
      modalWrapper.classList.remove('modal-print-area');
      window.removeEventListener('afterprint', handleAfterPrint);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    modalWrapper.classList.add('modal-print-area');
    window.print();
  };

  if (loading) return <div className="text-center p-4">Loading history...</div>;
  if (!history) return <div className="text-center p-4 text-red-500">Could not load history.</div>;

  const contentToRender = (
    <div className="space-y-6">
      <HistoryTable title="Purchase History" data={history.purchases || []} onViewInvoice={setViewingInvoiceId} />
      <HistoryTable title="Sale & Treatment History" data={history.sales || []} onViewInvoice={setViewingInvoiceId} />
    </div>
  );

  return (
    <>
        <div className="print-only">
            <PrintLayout title={`History for ${product.name}`}>
            {contentToRender}
            </PrintLayout>
        </div>

        <div className="no-print">
            <PrintLayout title={`History for ${product.name}`}>
                <div className="max-h-[60vh] overflow-y-auto">
                    {contentToRender}
                </div>
            </PrintLayout>
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

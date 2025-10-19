import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { Supplier, LedgerEntry } from '../types';
import { InvoiceDetailModal } from './InvoiceDetailModal';

interface SupplierLedgerViewProps {
  supplier: Supplier;
  startDate?: string;
  endDate?: string;
}

export const SupplierLedgerView: React.FC<SupplierLedgerViewProps> = ({ supplier, startDate, endDate }) => {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLedger() {
      setLoading(true);
      const data = await db.getSupplierLedger(supplier, { startDate, endDate });
      setLedger(data);
      setLoading(false);
    }
    loadLedger();
  }, [supplier, startDate, endDate]);
  
  const isInvoice = (id: string) => id.startsWith('trt#') || id.startsWith('sl#') || id.startsWith('pur#');

  if (loading) return <div className="text-center p-4">Loading ledger...</div>;

  return (
    <>
      <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="border-b">
              <th className="p-2 text-left font-semibold text-gray-600">Date</th>
              <th className="p-2 text-left font-semibold text-gray-600">Description</th>
              <th className="p-2 text-right font-semibold text-gray-600">Debit (Paid)</th>
              <th className="p-2 text-right font-semibold text-gray-600">Credit (Purchase)</th>
              <th className="p-2 text-right font-semibold text-gray-600">Balance (Owed)</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {ledger.length > 0 ? (
              ledger.map((entry, index) => (
                <tr key={`${entry.id}-${index}`} className="border-b hover:bg-gray-50">
                  <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="p-2">
                    {isInvoice(entry.id) ? (
                        <button onClick={() => setViewingInvoiceId(entry.id)} className="text-blue-600 hover:underline">
                            {entry.description}
                        </button>
                    ) : (
                        entry.description
                    )}
                  </td>
                  <td className="p-2 text-right">{entry.debit > 0 ? entry.debit.toFixed(2) : '-'}</td>
                  <td className="p-2 text-right">{entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</td>
                  <td className="p-2 text-right font-medium">{entry.balance.toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No transactions found in this period.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {viewingInvoiceId && (
          <InvoiceDetailModal invoiceId={viewingInvoiceId} onClose={() => setViewingInvoiceId(null)} />
      )}
    </>
  );
};
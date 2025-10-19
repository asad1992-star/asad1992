import React, { useState } from 'react';
import type { AccountTransaction } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PrinterIcon } from './icons/PrinterIcon';
import { PrintPreviewModal } from './PrintPreviewModal';

interface AccountsLedgerProps {
    transactions: AccountTransaction[];
    accountType: 'clinic' | 'owner';
    onEdit: (transaction: AccountTransaction) => void;
    onDelete: (id: string) => void;
    onViewInvoice: (invoiceId: string) => void;
}

export const AccountsLedger: React.FC<AccountsLedgerProps> = ({ transactions, accountType, onEdit, onDelete, onViewInvoice }) => {
    const [printingTransaction, setPrintingTransaction] = useState<AccountTransaction | null>(null);
    
    const filteredTransactions = transactions.filter(t => accountType === 'clinic' ? t.clinicAmount !== 0 : t.ownerAmount !== 0);

    const ledgerTable = (
         <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-max">
                <thead className="bg-gray-100">
                    <tr className="border-b">
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">ID</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Date</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600">Description</th>
                        <th className="p-3 text-right text-sm font-semibold text-gray-600">Debit</th>
                        <th className="p-3 text-right text-sm font-semibold text-gray-600">Credit</th>
                        <th className="p-3 text-right text-sm font-semibold text-gray-600">Balance</th>
                        <th className="p-3 text-left text-sm font-semibold text-gray-600 no-print-col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTransactions.length > 0 ? filteredTransactions.map(t => {
                        const amount = accountType === 'clinic' ? t.clinicAmount : t.ownerAmount;
                        const balance = accountType === 'clinic' ? t.clinicBalance : t.ownerBalance;
                        const isDebit = amount < 0;
                        const isInvoice = t.referenceId && (t.referenceId.startsWith('trt#') || t.referenceId.startsWith('sl#') || t.referenceId.startsWith('pur#'));

                        return (
                            <tr key={t.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700 font-medium">{t.id}</td>
                                <td className="p-3 text-sm text-gray-700">{new Date(t.date).toLocaleDateString()}</td>
                                <td className="p-3 text-sm text-gray-700">
                                    {isInvoice ? (
                                        <button onClick={() => onViewInvoice(t.referenceId!)} className="text-blue-600 hover:underline text-left">
                                            {t.description}
                                        </button>
                                    ) : (
                                        t.description
                                    )}
                                </td>
                                <td className="p-3 text-sm text-red-600 text-right">{isDebit ? Math.abs(amount).toFixed(2) : '-'}</td>
                                <td className="p-3 text-sm text-green-600 text-right">{!isDebit ? amount.toFixed(2) : '-'}</td>
                                <td className="p-3 text-sm text-gray-800 font-semibold text-right">{balance.toFixed(2)}</td>
                                <td className="p-3 text-sm no-print-col">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setPrintingTransaction(t)} title="Print Transaction" className="text-gray-600 hover:text-gray-800">
                                            <PrinterIcon className="h-5 w-5" />
                                        </button>
                                        {t.isManual && (
                                            <>
                                            <button onClick={() => onEdit(t)} title="Edit Transaction" className="text-blue-600 hover:text-blue-800">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => onDelete(t.id)} title="Delete Transaction" className="text-red-600 hover:text-red-800">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr><td colSpan={7} className="p-4 text-center text-gray-500">No transactions for this account.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
    
    return (
        <>
        {ledgerTable}
        <PrintPreviewModal
            isOpen={!!printingTransaction}
            onClose={() => setPrintingTransaction(null)}
            title={`Transaction Voucher #${printingTransaction?.id}`}
        >
            {printingTransaction && (
            <div className="text-sm p-4">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                        <p><strong>Transaction ID:</strong> {printingTransaction.id}</p>
                    </div>
                    <div className="text-right">
                        <p><strong>Date:</strong> {new Date(printingTransaction.date).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="mb-4">
                    <p><strong>Description:</strong></p>
                    <p>{printingTransaction.description}</p>
                </div>
                <div className="text-center border-t border-b py-6 my-6">
                    <p className="text-gray-600 uppercase tracking-wide">Amount</p>
                    <p className="text-4xl font-bold tracking-tight">
                        Rs {Math.abs(printingTransaction.clinicAmount || printingTransaction.ownerAmount).toFixed(2)}
                    </p>
                </div>
            </div>
            )}
      </PrintPreviewModal>
      </>
    );
};
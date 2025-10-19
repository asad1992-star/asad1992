import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { User, Payment, Customer, Supplier } from '../types';
import { Modal } from '../components/Modal';
import { PaymentForm } from '../components/PaymentForm';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { PrintPreviewModal } from '../components/PrintPreviewModal';
import { eventBus } from '../services/eventBus';

interface PaymentsScreenProps {
  user: User;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ user }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [parties, setParties] = useState<Map<string, { name: string }>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'receive' | 'pay' | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [printingPayment, setPrintingPayment] = useState<Payment | null>(null);

  const fetchData = useCallback(async () => {
    const paymentsData = await db.getPayments();
    setPayments(paymentsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const customers = await db.getCustomers();
    const suppliers = await db.getSuppliers();
    const partyMap = new Map<string, { name: string }>();
    customers.forEach(c => partyMap.set(c.id, { name: c.name }));
    suppliers.forEach(s => partyMap.set(s.id, { name: s.name }));
    setParties(partyMap);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNewPayment = (type: 'receive' | 'pay') => {
    setPaymentType(type);
    setIsModalOpen(true);
  };

  const handleSavePayment = async (paymentData: Omit<Payment, 'id'>) => {
    try {
      await db.savePayment(paymentData);
      fetchData(); // Refresh all data
      eventBus.dispatch('data-changed');
      setIsModalOpen(false);
      setPaymentType(null);
    } catch (error: any) {
      alert(`Failed to save payment: ${error.message}`);
    }
  };

  const getPartyName = (partyId: string) => {
    return parties.get(partyId)?.name || partyId;
  };

  const paymentsTableContent = (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full min-w-max">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left text-sm font-semibold text-gray-600">ID</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Date</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Type</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Party</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600">Amount</th>
              <th className="p-3 text-left text-sm font-semibold text-gray-600 no-print-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? payments.map(payment => (
              <tr key={payment.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm text-gray-700">{payment.id}</td>
                <td className="p-3 text-sm text-gray-700">{new Date(payment.date).toLocaleDateString()}</td>
                <td className="p-3 text-sm text-gray-700 capitalize">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${payment.type === 'receive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {payment.type}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-700 font-medium">{getPartyName(payment.partyId)}</td>
                <td className="p-3 text-sm text-gray-700">Rs {payment.amount.toFixed(2)}</td>
                <td className="p-3 text-sm no-print-col">
                    <button onClick={() => setPrintingPayment(payment)} title="Print Payment" className="text-gray-600 hover:text-gray-800">
                        <PrinterIcon className="h-5 w-5" />
                    </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="p-3 text-center text-gray-500">No payments recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsPreviewOpen(true)} className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold flex items-center gap-2">
                <PrinterIcon className="h-5 w-5" />
                Print List
            </button>
          <button onClick={() => handleNewPayment('receive')} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold">Receive Payment</button>
          <button onClick={() => handleNewPayment('pay')} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-semibold">Make Payment</button>
        </div>
      </div>
      
      {paymentsTableContent}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={paymentType === 'receive' ? 'Receive Payment' : 'Make Payment'}
      >
        {paymentType && <PaymentForm paymentType={paymentType} onSave={handleSavePayment} onCancel={() => setIsModalOpen(false)} />}
      </Modal>

      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Payments List"
      >
        {paymentsTableContent}
      </PrintPreviewModal>

      <PrintPreviewModal
        isOpen={!!printingPayment}
        onClose={() => setPrintingPayment(null)}
        title={`Payment Receipt #${printingPayment?.id}`}
      >
        {printingPayment && (
          <div className="text-sm p-4">
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                    <p><strong>Payment ID:</strong> PAY-{printingPayment.id}</p>
                    <p><strong>Type:</strong> <span className="capitalize">{printingPayment.type}</span></p>
                </div>
                <div className="text-right">
                    <p><strong>Date:</strong> {new Date(printingPayment.date).toLocaleDateString()}</p>
                    <p><strong>Party:</strong> {getPartyName(printingPayment.partyId)}</p>
                </div>
            </div>
            <div className="text-center border-t border-b py-6 my-6">
                <p className="text-gray-600 uppercase tracking-wide">{printingPayment.type === 'receive' ? 'Received Amount' : 'Paid Amount'}</p>
                <p className="text-4xl font-bold tracking-tight">Rs {printingPayment.amount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </PrintPreviewModal>
    </div>
  );
};

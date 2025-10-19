import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { InvoiceWithDetails } from '../types';
import { Modal } from './Modal';
import { InvoiceDetailView } from './InvoiceDetailView';

interface InvoiceDetailModalProps {
  invoiceId: string;
  onClose: () => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);

  useEffect(() => {
    if (invoiceId) {
      db.getInvoiceDetails(invoiceId).then(data => setInvoice(data || null));
    }
  }, [invoiceId]);

  return (
    <Modal 
        isOpen={!!invoiceId} 
        onClose={onClose} 
        title={`Invoice Details`} 
        size="4xl"
        wrapperClassName="invoice-detail-modal-wrapper"
    >
      {invoice ? <InvoiceDetailView invoice={invoice} /> : <p className="p-4 text-center">Loading invoice details...</p>}
    </Modal>
  );
};
import React from 'react';
import { Modal } from './Modal';
import { PrinterIcon } from './icons/PrinterIcon';
import { PrintLayout } from './PrintLayout';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="4xl"
    >
      {/* This is the content that gets sent to the printer. It's hidden on screen. */}
      <div className="print-only printable-area">
          <PrintLayout title={title}>
              {children}
          </PrintLayout>
      </div>
      
      {/* This is the on-screen preview. It's hidden during printing. */}
      <div className="no-print">
        <div className="max-h-[60vh] overflow-y-auto">
            {children}
        </div>
        <div className="pt-4 mt-4 border-t flex justify-end gap-4">
            <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
            Close
            </button>
            <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold flex items-center gap-2"
            >
            <PrinterIcon className="h-5 w-5" />
            Print
            </button>
        </div>
      </div>
    </Modal>
  );
};
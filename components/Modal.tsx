import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'xl' | '4xl' | '6xl';
  wrapperClassName?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', wrapperClassName = '' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
      md: 'max-w-md',
      xl: 'max-w-xl',
      '4xl': 'max-w-4xl',
      '6xl': 'max-w-6xl',
  }

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center printable-container-root ${wrapperClassName}`}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full m-4 ${sizeClasses[size]} modal-content-wrapper`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b no-print">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
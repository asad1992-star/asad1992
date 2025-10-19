import React from 'react';
import { VetIcon } from './icons/VetIcon';

interface PrintLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ children, title }) => (
  <div>
    <header className="print-header">
      {/* Professional Header */}
      <div className="flex justify-between items-start border-b pb-4 mb-4">
        {/* Left: Logo */}
        <div className="w-1/4">
          <VetIcon className="h-12 w-12 text-blue-600" />
        </div>
        
        {/* Center: Clinic Name & Address */}
        <div className="w-1/2 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Global Vet Clinic</h1>
          <p className="text-sm text-gray-600">123 Pet Lane, Animal City, PA 12345</p>
        </div>

        {/* Right: Contact Info */}
        <div className="w-1/4 text-right text-sm">
          <p className="text-gray-600">(123) 456-7890</p>
          <p className="text-gray-600">contact@globalvet.com</p>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-center my-4">{title}</h2>
    </header>
    <main className="print-content">
      {children}
    </main>
    <footer className="print-footer mt-8 pt-4 border-t text-center text-gray-500 text-sm">
      <p>Thank you for visiting us!</p>
    </footer>
  </div>
);

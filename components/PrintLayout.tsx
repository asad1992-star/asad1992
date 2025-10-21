import React from 'react';
import { db } from '../services/db';
import type { ClinicSettings } from '../types';
import { VetIcon } from './icons/VetIcon';

interface PrintLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ children, title }) => {
    const settings = db.getClinicSettingsSync();
    const printDate = new Date().toLocaleString();

    return (
        <div className="relative">
            {/* Watermark element - will be positioned behind the content by CSS z-index */}
            <div className="print-watermark print-only">
                {settings?.logo && <img src={settings.logo} alt="Clinic Watermark" />}
            </div>

            {/* Content wrapper */}
            <div className="relative z-10">
                <header className="print-header mb-6">
                    {/* Top bar with date and system name */}
                    <div className="flex justify-between items-center text-xs text-gray-500 border-b pb-2 mb-4">
                        <span>{printDate}</span>
                        <span>VetClinic Management System</span>
                    </div>

                    {/* Main Clinic Branding */}
                    <div className="text-center my-4">
                        <h1 className="text-3xl font-bold text-gray-900">{settings?.name || 'VetClinic'}</h1>
                        <p className="text-sm text-gray-600">{settings?.address || '123 Vet Street, Animal City'}</p>
                        <p className="text-sm text-gray-600">{`${settings?.phone || '555-123-4567'} | ${settings?.email || 'contact@vetclinic.com'}`}</p>
                    </div>

                    {/* Report Title */}
                    <h2 className="text-2xl font-semibold text-center py-4 border-t border-b">{title}</h2>
                </header>
                <main className="print-content">
                    {children}
                </main>
                <footer className="print-footer mt-8 pt-4 border-t text-center text-gray-500 text-sm">
                    <p>Thank you for visiting us!</p>
                </footer>
            </div>
        </div>
    );
};
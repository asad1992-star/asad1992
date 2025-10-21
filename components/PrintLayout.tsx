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

    return (
        <div className="relative">
            {/* Watermark element - will be z-index: 0 */}
            <div className="print-watermark print-only">
                {settings?.logo && <img src={settings.logo} alt="Clinic Watermark" />}
            </div>

            {/* Content wrapper - z-index: 10 ensures it's on top of the watermark */}
            <div className="relative z-10">
                <header className="print-header">
                    {/* Professional Header */}
                    <div className="flex justify-between items-start border-b pb-4 mb-4">
                        {/* This is a spacer to help with centering. It takes up no space if contact info is long. */}
                        <div className="flex-1"></div>
                        
                        {/* Center: Clinic Name & Address */}
                        <div className="px-4 text-center">
                            <h1 className="text-2xl font-bold text-gray-800">{settings?.name || 'VetClinic'}</h1>
                            <p className="text-sm text-gray-600">{settings?.address || 'Clinic Address, City, State'}</p>
                        </div>

                        {/* Right: Contact Info */}
                        <div className="flex-1 text-right text-sm">
                            <p className="text-gray-600">{settings?.phone || '(000) 000-0000'}</p>
                            <p className="text-gray-600">{settings?.email || 'email@example.com'}</p>
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
        </div>
    );
};
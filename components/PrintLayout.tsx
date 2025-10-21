
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import type { ClinicSettings } from '../types';
import { VetIcon } from './icons/VetIcon';

interface PrintLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ children, title }) => {
    const [settings, setSettings] = useState<ClinicSettings | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await db.getClinicSettings();
            setSettings(data);
        };
        fetchSettings();
    }, []);

    return (
        <div>
            <header className="print-header">
                {/* Professional Header */}
                <div className="flex justify-between items-start border-b pb-4 mb-4">
                    {/* Left: Logo */}
                    <div className="w-1/4 flex items-center">
                         {settings?.logo ? (
                            <img src={settings.logo} alt="Clinic Logo" className="h-12 w-auto max-w-full" />
                        ) : (
                            <VetIcon className="h-12 w-12 text-blue-600" />
                        )}
                    </div>
                    
                    {/* Center: Clinic Name & Address */}
                    <div className="w-1/2 text-center">
                        <h1 className="text-2xl font-bold text-gray-800">{settings?.name || 'VetClinic'}</h1>
                        <p className="text-sm text-gray-600">Clinic Address, City, State</p>
                    </div>

                    {/* Right: Contact Info */}
                    <div className="w-1/4 text-right text-sm">
                        <p className="text-gray-600">(000) 000-0000</p>
                        <p className="text-gray-600">email@example.com</p>
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
};

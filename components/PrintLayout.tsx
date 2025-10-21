import React from 'react';
import { db } from '../services/db';

interface PrintLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const PrintLayout: React.FC<PrintLayoutProps> = ({ children, title }) => {
    const settings = db.getClinicSettingsSync();
    // Format date and time exactly as in the image: 22/10/2025, 01:13
    const printDateTime = new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(' ', '');

    return (
        <div className="print-container">
            {/* 1. Page Header (Top) */}
            <header className="print-page-header">
                <span>{printDateTime}</span>
                <span>VetClinic Management System</span>
                {/* Empty span to push center text correctly */}
                <span style={{ display: 'inline-block', width: printDateTime.length + 'ch' }}></span>
            </header>

            <main className="print-main-content-wrapper">
                {/* 2. Main Content Box */}
                <div className="print-main-content">
                    {/* 3. Clinic Header */}
                    <div className="print-clinic-header">
                        <div className="clinic-info-center">
                            <p className="clinic-name">{settings?.name || 'VetClinic'}</p>
                            <p className="clinic-details">{settings?.address || 'Clinic Address, City, State'}</p>
                        </div>
                        <div className="clinic-info-right">
                            <p className="clinic-contact">{settings?.phone || '(000) 000-0000'}</p>
                            <p className="clinic-contact">{settings?.email || 'email@example.com'}</p>
                        </div>
                    </div>

                    {/* 4. Report Title */}
                    <div className="print-report-title-container">
                        <h2 className="print-report-title">{title}</h2>
                    </div>

                    {/* 5. Table (from children) */}
                    <div className="print-table-content">
                        {children}
                    </div>

                    {/* 6. Footer */}
                    <div className="print-thank-you-container">
                        <p className="print-thank-you">Thank you for visiting us!</p>
                    </div>
                </div>
            </main>
            
            {/* 7. Page Footer (Bottom) */}
            <footer className="print-page-footer">
                <span>https://vetclinic92.netlify.app</span>
                <span>1/1</span>
            </footer>
        </div>
    );
};
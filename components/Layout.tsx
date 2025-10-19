
import React, { useState, useEffect } from 'react';
import type { User, ClinicSettings } from '../types';
import { Sidebar } from './Sidebar';
import { DashboardScreen } from '../screens/DashboardScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { InvoicesScreen } from '../screens/InvoicesScreen';
import { CustomersScreen } from '../screens/CustomersScreen';
import { SuppliersScreen } from '../screens/SuppliersScreen';
import { PaymentsScreen } from '../screens/PaymentsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { db } from '../services/db';
import { eventBus } from '../services/eventBus';


interface LayoutProps {
  user: User;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);

  const fetchSettings = async () => {
      const settings = await db.getClinicSettings();
      setClinicSettings(settings);
  };
  
  useEffect(() => {
    fetchSettings();
    eventBus.on('settings-changed', fetchSettings);
    return () => eventBus.off('settings-changed', fetchSettings);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen user={user} />;
      case 'inventory':
        return <InventoryScreen user={user} />;
      case 'invoices':
        return <InvoicesScreen user={user} />;
      case 'customers':
        return <CustomersScreen user={user} />;
      case 'suppliers':
        return <SuppliersScreen user={user} />;
       case 'payments':
        return <PaymentsScreen user={user} />;
       case 'expenses':
        return <ExpensesScreen user={user} />;
       case 'reports':
        return <ReportsScreen user={user} />;
       case 'accounts':
        return <AccountsScreen user={user} />;
       case 'settings':
        return <SettingsScreen user={user} />;
      default:
        return <DashboardScreen user={user} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        currentScreen={currentScreen} 
        onScreenChange={setCurrentScreen} 
        clinicSettings={clinicSettings}
      />
      <main className="flex-1 p-6 overflow-y-auto">
        {renderScreen()}
      </main>
    </div>
  );
};

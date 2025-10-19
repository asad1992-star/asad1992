
import React from 'react';
import type { User, ClinicSettings } from '../types';
import { VetIcon } from './icons/VetIcon';

interface SidebarProps {
  user: User;
  onLogout: () => void;
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  clinicSettings: ClinicSettings | null;
}

const NavItem: React.FC<{
  label: string;
  screen: string;
  currentScreen: string;
  onClick: (screen: string) => void;
}> = ({ label, screen, currentScreen, onClick }) => (
  <button
    onClick={() => onClick(screen)}
    className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      currentScreen === screen
        ? 'bg-blue-600 text-white'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {label}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, currentScreen, onScreenChange, clinicSettings }) => {
  const navItems = [
    { screen: 'dashboard', label: 'Dashboard' },
    { screen: 'inventory', label: 'Inventory' },
    { screen: 'invoices', label: 'Invoices' },
    { screen: 'customers', label: 'Customers' },
    { screen: 'suppliers', label: 'Suppliers' },
    { screen: 'payments', label: 'Payments' },
    { screen: 'expenses', label: 'Expenses' },
  ];

  const adminNavItems = [
     { screen: 'reports', label: 'Reports' },
     { screen: 'accounts', label: 'Accounts' },
     { screen: 'settings', label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col no-print">
      <div className="h-16 flex items-center justify-center border-b border-gray-700 px-4">
        {clinicSettings?.logo ? (
            <img src={clinicSettings.logo} alt="Clinic Logo" className="w-10 h-10 mr-2 rounded-full object-cover"/>
        ) : (
            <VetIcon className="w-8 h-8 mr-2 text-blue-400" />
        )}
        <h1 className="text-xl font-bold truncate">{clinicSettings?.name || 'VetClinic'}</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(item => (
          <NavItem key={item.screen} {...item} currentScreen={currentScreen} onClick={onScreenChange} />
        ))}
        {user.role === 'admin' && <hr className="my-2 border-gray-700" />}
        {user.role === 'admin' && adminNavItems.map(item => (
           <NavItem key={item.screen} {...item} currentScreen={currentScreen} onClick={onScreenChange} />
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm">Signed in as</p>
        <p className="font-semibold capitalize">{user.username}</p>
        <button
          onClick={onLogout}
          className="w-full mt-4 text-left px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

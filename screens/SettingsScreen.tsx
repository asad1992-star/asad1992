import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import type { User, ClinicSettings } from '../types';
import { Modal } from '../components/Modal';
import { UserForm } from '../components/UserForm';
import { eventBus } from '../services/eventBus';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';

export const SettingsScreen: React.FC<{ user: User }> = ({ user }) => {
    const [settings, setSettings] = useState<ClinicSettings>({ name: '', logo: null });
    const [users, setUsers] = useState<User[]>([]);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    const fetchAllData = useCallback(async () => {
        const [clinicSettings, userList] = await Promise.all([
            db.getClinicSettings(),
            db.getUsers()
        ]);
        setSettings(clinicSettings);
        setUsers(userList);
    }, []);
    
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ ...settings, logo: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.saveClinicSettings(settings);
        eventBus.dispatch('settings-changed');
        alert('Clinic settings saved successfully!');
    };
    
    const handleAddUser = () => {
        setEditingUser({});
        setIsUserModalOpen(true);
    };

    const handleEditUser = (userToEdit: User) => {
        setEditingUser(userToEdit);
        setIsUserModalOpen(true);
    };
    
    const handleDeleteUser = async (userToDelete: User) => {
        if (userToDelete.id === user.id) {
            alert("You cannot delete your own account.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete the user "${userToDelete.username}"?`)) {
            await db.deleteUser(userToDelete.id);
            fetchAllData();
        }
    };

    const handleSaveUser = async (userData: User) => {
        try {
            await db.saveUser(userData);
            fetchAllData();
            setIsUserModalOpen(false);
            setEditingUser(null);
        } catch (error: any) {
            alert(`Error saving user: ${error.message}`);
        }
    };
    
    const handleBackup = async () => {
        try {
            const jsonData = await db.exportData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `vetclinic_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Backup successful!');
        } catch (error) {
            console.error('Backup failed:', error);
            alert('Failed to create backup.');
        }
    };


    if (user.role !== 'admin') {
        return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Access Denied: </strong>
            <span className="block sm:inline">You do not have permission to view this page.</span>
        </div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Clinic Settings Card */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">Clinic Details</h2>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Clinic Name</label>
                            <input type="text" name="name" id="name" value={settings.name} onChange={handleSettingsChange} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Clinic Logo</label>
                            <div className="mt-2 flex items-center gap-4">
                                {settings.logo ? (
                                    <img src={settings.logo} alt="Current Logo" className="h-16 w-16 rounded-full object-cover" />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">No Logo</div>
                                )}
                                <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            </div>
                        </div>
                        <div className="pt-4 text-right">
                             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">Save Settings</button>
                        </div>
                    </form>
                </div>

                {/* User Management Card */}
                <div className="bg-white p-6 rounded-lg shadow">
                     <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h2 className="text-xl font-semibold text-gray-700">User Management</h2>
                        <button onClick={handleAddUser} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold text-sm">Add User</button>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {users.map(u => (
                            <div key={u.id} className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-semibold text-gray-800">{u.username}</p>
                                    <p className="text-sm text-gray-500 capitalize">{u.role}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handleEditUser(u)} className="text-blue-600 hover:text-blue-800"><PencilIcon className="h-5 w-5"/></button>
                                    <button onClick={() => handleDeleteUser(u)} disabled={u.id === user.id} className="text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed"><TrashIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                 {/* Data Management Card */}
                <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-3 mb-4">Data Management</h2>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-800">Local Data Backup</h3>
                            <p className="text-sm text-gray-600 mt-1">Export all application data to a JSON file on your local machine.</p>
                        </div>
                        <button
                            onClick={handleBackup}
                            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold"
                        >
                            Export Backup
                        </button>
                    </div>
                </div>
            </div>
            
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser?.id ? 'Edit User' : 'Add User'}>
                {editingUser && <UserForm onSave={handleSaveUser} onCancel={() => setIsUserModalOpen(false)} user={editingUser} currentUser={user}/>}
            </Modal>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { eventBus } from '../services/eventBus';
// Fix: Aliased the imported type to avoid name collision with the component.
import type { SyncStatus as SyncStatusType } from '../services/syncService';

const StatusInfo: React.FC<{ color: string, icon: React.ReactNode, text: string }> = ({ color, icon, text }) => (
    <div className={`flex items-center gap-3 px-4 py-2 text-sm ${color}`}>
        {icon}
        <span className="font-medium">{text}</span>
    </div>
);

export const SyncStatus: React.FC = () => {
    const [status, setStatus] = useState<SyncStatusType>('online');
    const [pending, setPending] = useState(0);
    
    useEffect(() => {
        // Fix: Used the aliased type `SyncStatusType` for the event data.
        const handler = (data: { status: SyncStatusType, pending: number }) => {
            setStatus(data.status);
            setPending(data.pending);
        };
        eventBus.on('sync-status-changed', handler);
        
        // This is a simplified event bus; a robust solution would require a proper off() method with function reference management.
        // For this app's lifecycle, it's acceptable.
    }, []);

    const renderStatus = () => {
        switch (status) {
            case 'offline':
                return <StatusInfo color="bg-gray-600 text-white" icon={<OfflineIcon />} text={`Offline (${pending} changes saved locally)`} />;
            case 'syncing':
                return <StatusInfo color="bg-blue-500 text-white" icon={<SyncIcon />} text={`Syncing ${pending} changes...`} />;
            case 'pending':
                return <StatusInfo color="bg-yellow-400 text-black" icon={<PendingIcon />} text={`${pending} unsynced changes`} />;
            case 'online':
            default:
                return <StatusInfo color="bg-green-500 text-white" icon={<OnlineIcon />} text="Online & Synced" />;
        }
    };
    
    return <div>{renderStatus()}</div>;
};

// Icons are defined within the component for simplicity and to avoid creating many small files.
const OnlineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
const OfflineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" /><path d="M11.122 13.122l-1.415 1.414L8.293 13.121a1 1 0 011.414-1.414l1.415 1.414zm2.172-2.172a1 1 0 01-1.414 0L10 9.243l-1.88 1.879a1 1 0 01-1.414-1.414l1.414-1.415L6.243 6.414a1 1 0 011.414-1.414L10 6.414l2.343-2.344a1 1 0 111.414 1.414L11.414 8.243l1.88 1.88a1 1 0 010 1.414z" /></svg>;
const SyncIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>;
const PendingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
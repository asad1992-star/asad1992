import React, { useState, useEffect } from 'react';
import { backupService } from '../services/backupService';
import { eventBus } from '../services/eventBus';
import { ClockIcon } from './icons/ClockIcon';

const BACKUP_INTERVAL = 24 * 60 * 60 * 1000;

export const BackupStatusCard: React.FC = () => {
    const [lastBackup, setLastBackup] = useState<number | null>(null);
    const [timeLeft, setTimeLeft] = useState('');

    const updateLastBackupTime = (timestamp: number | null) => {
        setLastBackup(timestamp);
    };
    
    useEffect(() => {
        const initialTimestamp = backupService.getLastBackupTimestamp();
        updateLastBackupTime(initialTimestamp);

        const handleUpdate = (data: { lastBackup: number | null }) => {
            updateLastBackupTime(data.lastBackup);
        };
        eventBus.on('backup-update', handleUpdate);

        const timer = setInterval(() => {
            const last = backupService.getLastBackupTimestamp(); // Check local storage directly to stay in sync
            if (last) {
                const now = new Date().getTime();
                const nextBackupTime = last + BACKUP_INTERVAL;
                const remaining = nextBackupTime - now;

                if (remaining > 0) {
                    const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
                    const minutes = Math.floor((remaining / 1000 / 60) % 60).toString().padStart(2, '0');
                    const seconds = Math.floor((remaining / 1000) % 60).toString().padStart(2, '0');
                    setTimeLeft(`${hours}:${minutes}:${seconds}`);
                } else {
                    setTimeLeft('Backup is due...');
                }
            } else {
                 setTimeLeft('Not scheduled');
            }
        }, 1000);

        return () => {
            clearInterval(timer);
            // Note: The simple eventBus.off might not remove the listener correctly if the component re-renders often,
            // but it's acceptable for this app's lifecycle.
            eventBus.off('backup-update', handleUpdate);
        };
    }, []);

    const handleBackupNow = async () => {
        await backupService.performBackup();
        alert('Backup downloaded!');
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow flex flex-col">
            <div className="flex items-center gap-2">
                <ClockIcon className="h-6 w-6 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-700">Automatic Backup</h2>
            </div>
            <p className="text-gray-500 text-sm mt-2">
                Last backup: {lastBackup ? new Date(lastBackup).toLocaleString() : 'Never'}
            </p>
            <div className="mt-4 flex-grow">
                <p className="text-gray-600">Next backup in:</p>
                <p className="text-3xl font-bold text-gray-800">{timeLeft}</p>
            </div>
             <button
                onClick={handleBackupNow}
                className="w-full mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 font-semibold"
            >
                Backup Now
            </button>
        </div>
    );
};
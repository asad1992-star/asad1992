import { db } from './db';
import { eventBus } from './eventBus';

const LAST_BACKUP_KEY = 'vetclinic_last_auto_backup';
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class BackupService {
    private backupIntervalId: number | null = null;

    public start() {
        if (this.backupIntervalId) {
            clearInterval(this.backupIntervalId);
        }
        // Check immediately on start, in case the app was closed for a long time
        this.checkForAutoBackup();
        
        // Then check periodically (e.g., every minute) to see if it's time
        this.backupIntervalId = window.setInterval(() => {
            this.checkForAutoBackup();
        }, 60 * 1000); 
    }

    public stop() {
        if (this.backupIntervalId) {
            clearInterval(this.backupIntervalId);
            this.backupIntervalId = null;
        }
    }

    public getLastBackupTimestamp(): number | null {
        const timestamp = localStorage.getItem(LAST_BACKUP_KEY);
        return timestamp ? parseInt(timestamp, 10) : null;
    }

    private async checkForAutoBackup() {
        const lastBackupTimestamp = this.getLastBackupTimestamp();
        const now = new Date().getTime();

        if (!lastBackupTimestamp || (now - lastBackupTimestamp) > BACKUP_INTERVAL) {
            console.log('[BackupService] Triggering automatic daily backup.');
            await this.performBackup();
        } else {
            // Dispatch an event so the countdown can stay in sync if it's not time yet
            eventBus.dispatch('backup-update', { lastBackup: lastBackupTimestamp });
        }
    }

    public async performBackup() {
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
            
            const now = new Date().getTime();
            localStorage.setItem(LAST_BACKUP_KEY, now.toString());
            eventBus.dispatch('backup-update', { lastBackup: now });
            console.log('[BackupService] Backup download initiated.');
        } catch (error) {
            console.error('[BackupService] Backup failed:', error);
        }
    }
}

export const backupService = new BackupService();
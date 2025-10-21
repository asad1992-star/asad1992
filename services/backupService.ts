import { db } from './db';

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
        
        // Then check periodically (e.g., every hour) to see if it's time
        this.backupIntervalId = window.setInterval(() => {
            this.checkForAutoBackup();
        }, 60 * 60 * 1000); 
    }

    public stop() {
        if (this.backupIntervalId) {
            clearInterval(this.backupIntervalId);
            this.backupIntervalId = null;
        }
    }

    private async checkForAutoBackup() {
        const lastBackupTimestamp = localStorage.getItem(LAST_BACKUP_KEY);
        const now = new Date().getTime();

        if (!lastBackupTimestamp || (now - parseInt(lastBackupTimestamp, 10)) > BACKUP_INTERVAL) {
            console.log('[BackupService] Triggering automatic daily backup.');
            await this.performAutoBackup();
        }
    }

    private async performAutoBackup() {
        try {
            const jsonData = await db.exportData();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Use a consistent name for easier overwriting by the user in their downloads folder
            a.download = `vetclinic_auto_backup.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            localStorage.setItem(LAST_BACKUP_KEY, new Date().getTime().toString());
            console.log('[BackupService] Automatic backup download initiated.');
        } catch (error) {
            console.error('[BackupService] Automatic backup failed:', error);
        }
    }
}

export const backupService = new BackupService();

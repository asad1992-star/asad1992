import { db } from './db';
import { eventBus } from './eventBus';
import type { SyncOperation } from '../types';

export type SyncStatus = 'offline' | 'online' | 'syncing' | 'pending';

class SyncService {
    private status: SyncStatus = 'online';
    private isOnline: boolean = navigator.onLine;
    private syncInterval: number | null = null;
    private isProcessing = false;
    private pendingChangesCount = 0;

    constructor() {
        this.setStatus(navigator.onLine ? 'online' : 'offline');
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
        this.checkForPendingChanges(); // Initial check
    }

    private setStatus(newStatus: SyncStatus) {
        if (this.status !== newStatus) {
            this.status = newStatus;
            eventBus.dispatch('sync-status-changed', { status: this.status, pending: this.pendingChangesCount });
        }
    }
    
    private async checkForPendingChanges() {
        const queue = await db.getSyncQueue();
        const newCount = queue.length;
        
        if (this.pendingChangesCount !== newCount) {
             this.pendingChangesCount = newCount;
             eventBus.dispatch('sync-status-changed', { status: this.status, pending: this.pendingChangesCount });
        }

        if (this.isOnline) {
            this.setStatus(this.pendingChangesCount > 0 ? 'pending' : 'online');
        } else {
            this.setStatus('offline');
        }
    }

    private handleConnectionChange(online: boolean) {
        this.isOnline = online;
        if (online) {
            this.setStatus(this.pendingChangesCount > 0 ? 'pending' : 'online');
            this.startSync();
        } else {
            this.setStatus('offline');
            this.stopSync();
        }
    }

    startSync() {
        this.checkForPendingChanges();
        // Trigger sync immediately if there are pending changes
        if (this.isOnline && this.pendingChangesCount > 0) {
            this.processQueue();
        }
        // Also check periodically
        if (!this.syncInterval) {
            this.syncInterval = window.setInterval(() => {
                this.checkForPendingChanges();
                this.processQueue();
            }, 15000); // Check every 15 seconds
        }
    }

    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    private async processQueue() {
        if (!this.isOnline || this.isProcessing) {
            return;
        }
        
        let queue = await db.getSyncQueue();
        if (queue.length === 0) {
            if (this.pendingChangesCount !== 0) await this.checkForPendingChanges();
            return;
        }
        
        this.isProcessing = true;
        this.setStatus('syncing');
        console.log(`[SyncService] Starting sync for ${queue.length} items.`);

        // In a real app, this would be a loop sending requests to a server.
        // We simulate one by one with delays.
        while(queue.length > 0) {
            const op = queue[0];
            console.log(`[SyncService] Syncing operation: ${op.action} on ${op.collection}`, op.payload);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            console.log('[SyncService] Operation successful (simulated).');
            await db.clearSyncOperations([op.id]);
            await this.checkForPendingChanges();

            // fetch the queue again
            queue = await db.getSyncQueue();
        }
        
        console.log('[SyncService] Sync complete.');
        this.setStatus('online');
        this.isProcessing = false;
    }
}

export const syncService = new SyncService();

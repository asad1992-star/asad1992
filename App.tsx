import React, { useState, useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { Layout } from './components/Layout';
import { db } from './services/db';
import { syncService } from './services/syncService';
import { backupService } from './services/backupService';
import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeApp() {
      try {
        await db.init();
        // FIX: Property 'start' does not exist on type 'SyncService'. The correct method is 'startSync'.
        syncService.startSync();
        backupService.start();
      } catch (error) {
        console.error("Failed to initialize the app:", error);
        // You could show an error message to the user here
      } finally {
        setLoading(false);
      }
    }
    initializeApp();

    // Cleanup services on component unmount
    return () => {
      // FIX: Property 'stop' does not exist on type 'SyncService'. The correct method is 'stopSync'.
      syncService.stopSync();
      backupService.stop();
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Loading VetClinic...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Layout user={user} onLogout={handleLogout} />;
}

export default App;

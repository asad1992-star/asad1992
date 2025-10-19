import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import type { User } from './types';
import { LoginScreen } from './screens/LoginScreen';
import { Layout } from './components/Layout';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await db.init();
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setError("Could not initialize the application database. Please try refreshing the page.");
        setIsLoading(false);
      }
    };
    initializeDB();
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Initializing Application...</div>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Layout user={user} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;

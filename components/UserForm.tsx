
import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface UserFormProps {
  user: Partial<User>;
  currentUser: User;
  onSave: (user: User) => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, currentUser, onSave, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  
  const isEditing = !!user.id;
  const isEditingSelf = user.id === currentUser.id;

  useEffect(() => {
    setUsername(user.username || '');
    setPassword(''); // Always clear password field for security
    setRole(user.role || 'staff');
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      alert('Username is required.');
      return;
    }
    if (!isEditing && !password) {
        alert('Password is required for new users.');
        return;
    }

    onSave({
        id: user.id || '', // DB will create new ID if this is empty
        username,
        password, // Send empty string if not changed, DB will handle it
        role
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isEditing ? 'Leave blank to keep unchanged' : ''}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-100"
          disabled={isEditingSelf && role === 'admin'}
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        {isEditingSelf && role === 'admin' && <p className="text-xs text-gray-500 mt-1">You cannot revoke your own admin rights.</p>}
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save User
        </button>
      </div>
    </form>
  );
};

import React from 'react';
import { useMockAuth } from '../contexts/MockAuthContext';
import { User, LogOut } from 'lucide-react';

const UserInfo: React.FC = () => {
  const { user, logout, isLoading } = useMockAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          <User size={16} />
        </div>
        <div className="text-sm">
          <div className="font-medium">{user.name}</div>
          <div className="text-xs text-gray-500">{user.role}</div>
        </div>
      </div>
      <button
        onClick={() => logout()}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        title="Logout"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
};

export default UserInfo; 
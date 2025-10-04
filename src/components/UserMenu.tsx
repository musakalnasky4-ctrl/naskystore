import { useState } from 'react';
import { User, LogIn, LogOut, Settings, Shield, History } from 'lucide-react';
import { Profile } from '../lib/supabase';

interface UserMenuProps {
  user: Profile | null;
  onLogin: () => void;
  onLogout: () => void;
  onAdminLogin: () => void;
  onEditProfile: () => void;
  onDepositHistory: () => void;
}

export default function UserMenu({ user, onLogin, onLogout, onAdminLogin, onEditProfile, onDepositHistory }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white hover:bg-gray-50 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg"
      >
        <User className="w-6 h-6 text-gray-700" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl z-40 overflow-hidden">
            {user ? (
              <div className="p-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{user.name || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      onEditProfile();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onDepositHistory();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span className="text-sm">History Deposit</span>
                  </button>

                  {!user.is_admin && (
                    <button
                      onClick={() => {
                        onAdminLogin();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Admin Login</span>
                    </button>
                  )}

                  {user.is_admin && (
                    <div className="px-3 py-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Admin</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onLogin();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-medium">Login</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

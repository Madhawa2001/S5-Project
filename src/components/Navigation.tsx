import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Menu, X, LogOut, User } from 'lucide-react';
// import { useAuth } from '../contexts/AuthContext';
import { useAuth } from '../contexts/MockAuthContext';
import { Badge } from './ui/Badge';

export function Navigation() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  const menuItems = {
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard' },
      { path: '/admin/users', label: 'User Management' },
    ],
    doctor: [
      { path: '/doctor/dashboard', label: 'Dashboard' },
    ],
    lab_assistant: [
      { path: '/lab/dashboard', label: 'Dashboard' },
      { path: '/lab/assessment/new', label: 'New Assessment' },
    ],
  };

  const currentMenuItems = menuItems[user.role] || [];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-semibold text-gray-900">ReproSight</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {currentMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-primary-600 border-b-2 border-primary-600 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <Badge variant="role" role={user.role} className="text-xs">
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                  <button
                    onClick={() => {
                      void signOut();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {currentMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-200">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <Badge variant="role" role={user.role} className="text-xs mt-1">
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
              <button
                onClick={() => {
                  void signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

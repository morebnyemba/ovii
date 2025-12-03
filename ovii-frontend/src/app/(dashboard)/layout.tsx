'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { Wallet, Landmark, History, User, LogOut, Menu, X, Gift, Shield, Bell } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/useUserStore';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import api from '@/lib/api';

// Ovii brand colors
const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { logout, user, isAuthenticated } = useUserStore();

  const navItems = [
    { name: 'Wallet', href: '/dashboard', icon: Wallet },
    { name: 'Send Money', href: '/send', icon: Landmark },
    { name: 'Transaction History', href: '/history', icon: History },
    { name: 'Referrals', href: '/referrals', icon: Gift },
    { name: 'KYC Verification', href: '/kyc', icon: Shield },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications/notifications/');
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      // Silently fail for notification fetching - non-critical feature
      console.error('Failed to fetch notifications:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    // Optimistically update UI
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      await api.patch(`/notifications/notifications/${id}/`, { is_read: true });
    } catch (error) {
      // Revert optimistic update on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = async () => {
    logout();
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  };

  const SidebarContent = () => (
    <>
      <div 
        className="p-6 text-2xl font-bold border-b border-white/20"
        style={{ color: COLORS.gold }}
      >
        Ovii
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 text-center border-b border-white/10">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" 
             style={{ backgroundColor: COLORS.mint }}>
          <User className="text-white" size={24} />
        </div>
        <p className="font-semibold text-white">{user?.first_name} {user?.last_name}</p>
        <p className="text-sm" style={{ color: COLORS.mint }}>{user?.phone_number}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href} 
            className="flex items-center px-4 py-3 mb-2 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: COLORS.white }}
            onClick={() => setSidebarOpen(false)}
          >
            <item.icon className="w-5 h-5 mr-3" style={{ color: COLORS.mint }} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/20">
        <button 
          onClick={handleLogout} 
          className="flex items-center w-full px-4 py-3 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: COLORS.coral }}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <WebSocketProvider>
      {/* The Toaster component renders notifications anywhere in the app */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          success: {
            duration: 5000,
          },
        }}
      />
      <div className="relative md:flex h-screen" style={{ backgroundColor: COLORS.lightGray }}>
        {/* Mobile Sidebar Overlay */}
        <div 
          className={`fixed inset-0 z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'bg-black/60 opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Mobile Sidebar */}
        <aside 
          className={`fixed top-0 left-0 h-full w-64 flex flex-col z-40 transition-transform duration-300 ease-in-out md:hidden`}
          style={{ 
            backgroundColor: COLORS.indigo,
            transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)' 
          }}
        >
          <SidebarContent />
        </aside>

        {/* Desktop Sidebar */}
        <aside 
          className="w-64 flex-col hidden md:flex"
          style={{ backgroundColor: COLORS.indigo }}
        >
          <SidebarContent />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <header 
            className="p-4 shadow-md hidden md:flex justify-between items-center"
            style={{ backgroundColor: COLORS.white }}
          >
            <div className="text-xl font-bold" style={{ color: COLORS.indigo }}>
              Dashboard
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell size={24} style={{ color: COLORS.indigo }} />
                {unreadCount > 0 && (
                  <span 
                    className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-xs font-bold text-white rounded-full"
                    style={{ backgroundColor: COLORS.coral }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div 
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-xl z-50"
                  style={{ backgroundColor: COLORS.white }}
                >
                  <div className="p-4 border-b" style={{ borderColor: COLORS.lightGray }}>
                    <h3 className="font-bold" style={{ color: COLORS.indigo }}>Notifications</h3>
                  </div>
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.slice(0, 10).map((notification) => (
                        <div 
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!notification.is_read ? 'bg-blue-50' : ''}`}
                          style={{ borderColor: COLORS.lightGray }}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className={`w-2 h-2 rounded-full mt-2 flex-shrink-0`}
                              style={{ backgroundColor: notification.is_read ? 'transparent' : COLORS.mint }}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-sm" style={{ color: COLORS.indigo }}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell size={32} className="mx-auto mb-2 opacity-30" />
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Mobile Header */}
          <header 
            className="p-4 shadow-md md:hidden flex justify-between items-center"
            style={{ backgroundColor: COLORS.white }}
          >
            <div 
              className="text-xl font-bold"
              style={{ color: COLORS.indigo }}
            >
              Ovii
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Bell size={20} style={{ color: COLORS.indigo }} />
                  {unreadCount > 0 && (
                    <span 
                      className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-xs font-bold text-white rounded-full"
                      style={{ backgroundColor: COLORS.coral }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                style={{ color: COLORS.indigo }}
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </header>

          {/* Mobile Notifications Dropdown */}
          {showNotifications && (
            <div 
              className="absolute top-16 right-4 left-4 md:hidden max-h-80 overflow-y-auto rounded-xl shadow-xl z-50"
              style={{ backgroundColor: COLORS.white }}
            >
              <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: COLORS.lightGray }}>
                <h3 className="font-bold" style={{ color: COLORS.indigo }}>Notifications</h3>
                <button onClick={() => setShowNotifications(false)}>
                  <X size={20} style={{ color: COLORS.indigo }} />
                </button>
              </div>
              {notifications.length > 0 ? (
                <div>
                  {notifications.slice(0, 5).map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 border-b cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                      style={{ borderColor: COLORS.lightGray }}
                    >
                      <p className="font-semibold text-sm" style={{ color: COLORS.indigo }}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p>No notifications</p>
                </div>
              )}
            </div>
          )}

          {/* Content Container */}
          <div 
            className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto"
            style={{ backgroundColor: COLORS.white }}
          >
            {children}
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}
'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { Wallet, Landmark, History, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/useUserStore';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { logout, user } = useUserStore();

  const navItems = [
    { name: 'Wallet', href: '/', icon: Wallet },
    { name: 'Send Money', href: '/send', icon: Landmark },
    { name: 'Transaction History', href: '/history', icon: History },
    { name: 'Profile', href: '/profile', icon: User },
  ];

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
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              style={{ color: COLORS.indigo }}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

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
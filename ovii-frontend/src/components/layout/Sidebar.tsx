import React from 'react';
import Link from 'next/link';
import { Wallet, Landmark, History, User, LogOut, Users, Briefcase, DollarSign } from 'lucide-react';
import { useUserStore } from '@/lib/store/useUserStore';
import { useRouter, usePathname } from 'next/navigation';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

const userNavItems = [
  { name: 'Wallet', href: '/dashboard', icon: Wallet },
  { name: 'Send Money', href: '/send', icon: Landmark },
  { name: 'Transaction History', href: '/history', icon: History },
  { name: 'Profile', href: '/profile', icon: User },
];

const agentNavItems = [
  { name: 'Dashboard', href: '/agent/dashboard', icon: Wallet },
  { name: 'Onboarding', href: '/agent/onboarding', icon: Users },
  { name: 'Cash In/Out', href: '/agent/cash-in-out', icon: Briefcase },
  { name: 'Commissions', href: '/agent/commissions', icon: DollarSign },
  { name: 'Profile', href: '/agent/profile', icon: User },
];

const SidebarContent = ({ setSidebarOpen }: { setSidebarOpen: (isOpen: boolean) => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useUserStore();

  const handleLogout = async () => {
    logout();
    await fetch('/api/logout', { method: 'POST' });
    router.replace('/login');
  };

  const navItems = pathname.startsWith('/agent') ? agentNavItems : userNavItems;

  return (
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
};

export const Sidebar = ({ isOpen, setSidebarOpen }: { isOpen: boolean, setSidebarOpen: (isOpen: boolean) => void }) => {
  return (
    <aside 
      className={`fixed top-0 left-0 h-full w-64 flex flex-col z-40 transition-transform duration-300 ease-in-out md:hidden`}
      style={{ 
        backgroundColor: COLORS.indigo,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' 
      }}
    >
      <SidebarContent setSidebarOpen={setSidebarOpen} />
    </aside>
  );
};

export const DesktopSidebar = () => {
  return (
    <aside 
      className="w-64 flex-col hidden md:flex"
      style={{ backgroundColor: COLORS.indigo }}
    >
      <SidebarContent setSidebarOpen={() => {}} />
    </aside>
  );
};
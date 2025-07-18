import React from 'react';
import Link from 'next/link';
import { Wallet, Landmark, History, User, LogOut } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navItems = [
        { name: 'Wallet', href: '/', icon: Wallet },
        { name: 'Send', href: '/send', icon: Landmark },
        { name: 'History', href: '/history', icon: History },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-ovii-indigo text-white flex flex-col">
                <div className="p-6 text-2xl font-bold border-b border-white/20">
                    Ovii
                </div>
                <nav className="flex-1 px-4 py-6">
                    {navItems.map((item) => (
                        <Link key={item.name} href={item.href} className="flex items-center px-4 py-3 mb-2 rounded-lg hover:bg-white/10 transition-colors">
                            <item.icon className="w-5 h-5 mr-3" />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-white/20">
                    <button className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-white/10 transition-colors">
                        <LogOut className="w-5 h-5 mr-3" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Header can go here */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
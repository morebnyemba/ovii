'use client';

import React from 'react';
import Link from 'next/link';
import { Wallet, Landmark, History, User, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const navItems = [
        { name: 'Wallet', href: '/', icon: Wallet },
        { name: 'Send', href: '/send', icon: Landmark },
        { name: 'History', href: '/history', icon: History },
        { name: 'Profile', href: '/profile', icon: User },
    ];

    const SidebarContent = () => (
        <>
            <div className="p-6 text-2xl font-bold border-b border-white/20">
                Ovii
            </div>
            <nav className="flex-1 px-4 py-6">
                {navItems.map((item) => (
                    <Link 
                        key={item.name} 
                        href={item.href} 
                        className="flex items-center px-4 py-3 mb-2 rounded-lg hover:bg-white/10 transition-colors"
                        onClick={() => setSidebarOpen(false)} // Close sidebar on mobile nav click
                    >
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
        </>
    );

    return (
        <div className="relative md:flex h-screen bg-gray-100">
            {/* --- Mobile Sidebar (Overlay) --- */}
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/60 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full w-64 bg-[--ovii-indigo] text-white flex flex-col z-40 transform transition-transform ease-in-out duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            {/* --- Desktop Sidebar (Fixed) --- */}
            <aside className="w-64 bg-[--ovii-indigo] text-white flex-col hidden md:flex">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                {/* Mobile Header */}
                <header className="p-4 bg-white shadow-md md:hidden flex justify-between items-center">
                    <div className="text-xl font-bold text-[--ovii-indigo]">Ovii</div>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
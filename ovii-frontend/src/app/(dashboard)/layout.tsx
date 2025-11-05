'use client';

import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { WebSocketProvider } from '@/components/providers/WebSocketProvider';
import { Sidebar, DesktopSidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <WebSocketProvider>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          success: {
            duration: 5000,
          },
        }}
      />
      <div className="relative md:flex h-screen bg-lightGray">
        {/* Mobile Sidebar Overlay */}
        <div 
          className={`fixed inset-0 z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'bg-black/60 opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        <Sidebar isOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <DesktopSidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

          {/* Content Container */}
          <div 
            className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-white"
          >
            {children}
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}
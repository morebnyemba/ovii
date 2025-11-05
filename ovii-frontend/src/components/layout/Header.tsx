import React from 'react';
import { Menu, X } from 'lucide-react';

export const Header = ({ isSidebarOpen, setSidebarOpen }: { isSidebarOpen: boolean, setSidebarOpen: (isOpen: boolean) => void }) => {
  return (
    <header 
      className="p-4 shadow-md md:hidden flex justify-between items-center bg-white"
    >
      <div 
        className="text-xl font-bold text-indigo"
      >
        Ovii
      </div>
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="text-indigo"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
};
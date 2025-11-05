import React from 'react';
import { Menu, X } from 'lucide-react';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

export const Header = ({ isSidebarOpen, setSidebarOpen }: { isSidebarOpen: boolean, setSidebarOpen: (isOpen: boolean) => void }) => {
  return (
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
  );
};
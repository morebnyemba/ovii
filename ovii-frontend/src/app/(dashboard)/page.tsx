'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiSend, FiPlusCircle, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { useUserStore } from '@/lib/store/useUserStore';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  white: '#FDFDFD',
};

export default function DashboardPage() {
    const { user, wallet, fetchWallet, loading, error, isAuthenticated } = useUserStore();

    useEffect(() => {
        if (isAuthenticated) {
            fetchWallet();
        }
    }, [isAuthenticated, fetchWallet]);

    const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-white p-6 rounded-2xl shadow-lg ${className}`}
        >
            {children}
        </motion.div>
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <FiLoader className="animate-spin text-4xl" style={{ color: COLORS.gold }} />
                <p className="mt-4 text-lg" style={{ color: COLORS.indigo }}>Loading Your Dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FiAlertTriangle className="text-4xl text-red-500" />
                <p className="mt-4 text-lg text-red-600">Error: {error}</p>
                <p className="text-sm text-gray-500 mt-2">We couldn't load your dashboard. Please try again later.</p>
                <button
                    onClick={() => fetchWallet()}
                    className="mt-4 bg-ovii-gold text-ovii-indigo font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
                    Welcome back, {user?.first_name || 'User'}!
                </h1>
                <p className="text-gray-500 mt-1">Here's a snapshot of your finances.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
                    <p className="text-lg opacity-80">Total Balance</p>
                    <p className="text-4xl md:text-5xl font-bold mt-2">
                        {wallet?.currency} {parseFloat(wallet?.balance || '0').toFixed(2)}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <Link href="/send" passHref>
                            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-ovii-gold text-ovii-indigo font-bold py-3 px-6 rounded-full shadow-md">
                                <FiSend />
                                Send Money
                            </motion.a>
                        </Link>
                        <Link href="/request" passHref>
                            <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 bg-ovii-mint text-ovii-indigo font-bold py-3 px-6 rounded-full shadow-md">
                                <FiPlusCircle />
                                Request Money
                            </motion.a>
                        </Link>
                    </div>
                </Card>

                <Card>
                    <h2 className="font-bold text-lg" style={{ color: COLORS.indigo }}>Quick Actions</h2>
                    <ul className="mt-4 space-y-3">
                        <li><Link href="/history" className="flex items-center gap-3 hover:text-ovii-gold transition-colors"><FiTrendingUp/> Transaction History</Link></li>
                        <li><Link href="/beneficiaries" className="flex items-center gap-3 hover:text-ovii-gold transition-colors"><FiPlusCircle/> Add Beneficiary</Link></li>
                        <li><Link href="/profile" className="flex items-center gap-3 hover:text-ovii-gold transition-colors"><FiPlusCircle/> My Profile</Link></li>
                    </ul>
                </Card>
            </div>

            {/* Placeholder for recent transactions */}
            <Card>
                <h2 className="font-bold text-lg mb-4" style={{ color: COLORS.indigo }}>Recent Activity</h2>
                <div className="text-center text-gray-500 py-8">
                    <p>Transaction history will be shown here.</p>
                </div>
            </Card>
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiSend, FiLoader, FiAlertTriangle, FiUser, FiUserPlus, FiDollarSign, FiArrowUpRight, FiArrowDownLeft } from 'react-icons/fi';
import { useUserStore } from '@/lib/store/useUserStore';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

// Define a type for our transaction for better type-safety
type Transaction = {
    id: string;
    type: 'sent' | 'received';
    amount: string;
    currency: string;
    party: string;
    date: string;
};

export default function DashboardPage() {
    const { user, wallet, fetchWallet, loading, error, isAuthenticated, _hasHydrated } = useUserStore();
    // In a real app, this would likely be part of a dedicated store or hook
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(true);

    useEffect(() => {
        if (_hasHydrated && isAuthenticated) {
            fetchWallet();
            // Simulate fetching recent transactions
            // TODO: Replace with actual API call, e.g., api.get('/transactions/recent')
            setTimeout(() => {
                setRecentTransactions([
                    { id: '1', type: 'sent', amount: '50.00', currency: 'USD', party: 'John Doe', date: '2024-05-20' },
                    { id: '2', type: 'received', amount: '120.00', currency: 'USD', party: 'Jane Smith', date: '2024-05-19' },
                    { id: '3', type: 'sent', amount: '15.50', currency: 'USD', party: 'Online Store', date: '2024-05-18' },
                ]);
                setTransactionsLoading(false);
            }, 1500);
        }
    }, [_hasHydrated, isAuthenticated, fetchWallet]);

    const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`bg-white p-6 rounded-2xl shadow-lg ${className}`}
            style={{ boxShadow: '0 4px 20px rgba(26, 27, 75, 0.1)' }}
        >
            {children}
        </motion.div>
    );

    if (!_hasHydrated || loading.wallet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <FiLoader className="animate-spin text-4xl" style={{ color: COLORS.gold }} />
                <p className="mt-4 text-lg" style={{ color: COLORS.indigo }}>Loading Your Dashboard...</p>
            </div>
        );
    }

    if (error.wallet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FiAlertTriangle className="text-4xl" style={{ color: COLORS.coral }} />
                <p className="mt-4 text-lg" style={{ color: COLORS.indigo }}>Error: {error.wallet}</p>
                <p className="text-sm" style={{ color: COLORS.darkIndigo }}>We couldn't load your dashboard. Please try again later.</p>
                <button
                    onClick={() => fetchWallet()}
                    className="mt-4 font-bold py-2 px-6 rounded-md transition-colors"
                    style={{ 
                        backgroundColor: COLORS.gold,
                        color: COLORS.indigo,
                        boxShadow: '0 2px 10px rgba(255, 194, 71, 0.3)'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }
    
    if (!wallet) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <FiAlertTriangle className="text-4xl" style={{ color: COLORS.gold }} />
                <p className="mt-4 text-lg" style={{ color: COLORS.indigo }}>No wallet found for your account.</p>
                <p className="text-sm" style={{ color: COLORS.darkIndigo }}>It may still be being created. Please refresh in a moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
                    Welcome back, {user?.first_name || 'User'}!
                </h1>
                <p className="mt-1" style={{ color: COLORS.darkIndigo }}>Here's a snapshot of your finances.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <Card className="lg:col-span-2" style={{ 
                    background: `linear-gradient(135deg, ${COLORS.indigo} 0%, ${COLORS.darkIndigo} 100%)`,
                    color: COLORS.white
                }}>
                    <p className="text-lg opacity-90">Total Balance</p>
                    <p className="text-4xl md:text-5xl font-bold mt-2">
                        {wallet.currency} {parseFloat(wallet.balance).toFixed(2)}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link href="/send">
                            <motion.div 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }} 
                                className="flex cursor-pointer items-center gap-2 font-bold py-3 px-6 rounded-full shadow-md"
                                style={{ 
                                    backgroundColor: COLORS.gold,
                                    color: COLORS.indigo
                                }}
                            >
                                <FiSend className="text-lg" />
                                <span>Send Money</span>
                            </motion.div>
                        </Link>
                        <Link href="/request">
                            <motion.div 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }} 
                                className="flex cursor-pointer items-center gap-2 font-bold py-3 px-6 rounded-full shadow-md"
                                style={{ 
                                    backgroundColor: COLORS.mint,
                                    color: COLORS.indigo
                                }}
                            >
                                <FiDollarSign className="text-lg" />
                                <span>Request Money</span>
                            </motion.div>
                        </Link>
                    </div>
                </Card>

                {/* Quick Actions Card */}
                <Card>
                    <h2 className="font-bold text-lg" style={{ color: COLORS.indigo }}>Quick Actions</h2>
                    <ul className="mt-4 space-y-4">
                        <li>
                            <Link 
                                href="/history" 
                                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-indigo-50"
                                style={{ color: COLORS.darkIndigo }}
                            >
                                <FiTrendingUp className="text-lg" style={{ color: COLORS.gold }} />
                                <span>Transaction History</span>
                            </Link>
                        </li>
                        <li>
                            <Link 
                                href="/beneficiaries" 
                                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-indigo-50"
                                style={{ color: COLORS.darkIndigo }}
                            >
                                <FiUserPlus className="text-lg" style={{ color: COLORS.mint }} />
                                <span>Add Beneficiary</span>
                            </Link>
                        </li>
                        <li>
                            <Link 
                                href="/profile" 
                                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-indigo-50"
                                style={{ color: COLORS.darkIndigo }}
                            >
                                <FiUser className="text-lg" style={{ color: COLORS.coral }} />
                                <span>My Profile</span>
                            </Link>
                        </li>
                    </ul>
                </Card>
            </div>

            {/* Recent Activity Card */}
            <Card>
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg" style={{ color: COLORS.indigo }}>Recent Activity</h2>
                    <Link 
                        href="/history" 
                        className="text-sm font-medium"
                        style={{ color: COLORS.gold }}
                    >
                        View All
                    </Link>
                </div>
                {transactionsLoading ? (
                    <div className="mt-4 text-center py-8 flex items-center justify-center" style={{ color: COLORS.darkIndigo }}>
                        <FiLoader className="animate-spin text-2xl mr-3" />
                        <span>Loading recent activity...</span>
                    </div>
                ) : recentTransactions.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                        {recentTransactions.map((tx, index) => (
                            <motion.li
                                key={tx.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-lightGray"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${tx.type === 'sent' ? 'bg-red-100' : 'bg-green-100'}`}>
                                        {tx.type === 'sent' ? (
                                            <FiArrowUpRight style={{ color: COLORS.coral }} />
                                        ) : (
                                            <FiArrowDownLeft style={{ color: COLORS.mint }} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold" style={{ color: COLORS.darkIndigo }}>{tx.type === 'sent' ? 'Sent to' : 'Received from'} {tx.party}</p>
                                        <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                <p className={`font-bold ${tx.type === 'sent' ? 'text-red-500' : 'text-green-500'}`}>
                                    {tx.type === 'sent' ? '-' : '+'} {tx.currency} {tx.amount}
                                </p>
                            </motion.li>
                        ))}
                    </ul>
                ) : (
                    <div className="mt-4 text-center py-8" style={{ color: COLORS.darkIndigo }}>
                        <FiTrendingUp className="mx-auto text-3xl opacity-30" />
                        <p className="mt-2">Your recent transactions will appear here</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
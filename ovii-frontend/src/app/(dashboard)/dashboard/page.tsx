'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiSend, FiAlertTriangle, FiUser, FiUserPlus, FiDollarSign, FiArrowUpRight, FiArrowDownLeft, FiGift, FiShield, FiCreditCard, FiBriefcase } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useUserStore } from '@/lib/store/useUserStore';
import TypedText from '@/components/ui/typed-text';
import { TYPED_STRINGS, TYPED_TEXT_MIN_HEIGHTS } from '@/lib/constants/typed-text-strings';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

// Skeleton components for better loading states
const BalanceCardSkeleton = () => (
  <div className="lg:col-span-2" style={{ backgroundColor: COLORS.lightGray, padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
    <Skeleton width={120} height={24} />
    <Skeleton width={200} height={48} className="mt-2" />
    <div className="mt-8 flex flex-wrap gap-4">
      <Skeleton width={120} height={48} borderRadius={24} />
      <Skeleton width={140} height={48} borderRadius={24} />
    </div>
  </div>
);

const QuickActionsSkeleton = () => (
  <div style={{ backgroundColor: COLORS.white, padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
    <Skeleton width={120} height={24} />
    <div className="mt-4 space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-3 p-3">
          <Skeleton circle width={24} height={24} />
          <Skeleton width={120} height={20} />
        </div>
      ))}
    </div>
  </div>
);

const RecentActivitySkeleton = () => (
  <div style={{ backgroundColor: COLORS.white, padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
    <div className="flex justify-between">
      <Skeleton width={120} height={24} />
      <Skeleton width={60} height={20} />
    </div>
    <div className="mt-4 space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-center justify-between p-3">
          <div className="flex items-center gap-4">
            <Skeleton circle width={40} height={40} />
            <div>
              <Skeleton width={120} height={20} />
              <Skeleton width={80} height={16} className="mt-1" />
            </div>
          </div>
          <Skeleton width={80} height={20} />
        </div>
      ))}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, wallet, transactions, fetchWallet, fetchTransactions, loading, error, isAuthenticated, _hasHydrated } = useUserStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      fetchWallet();
      if (transactions && transactions.length === 0) {
        fetchTransactions();
      }
    }
  }, [_hasHydrated, isAuthenticated, fetchWallet, fetchTransactions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchWallet(), fetchTransactions()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate financial insights
  const getFinancialInsights = () => {
    if (!transactions || transactions.length === 0 || !user) {
      return {
        totalSent: 0,
        totalReceived: 0,
        transactionCount: 0,
        avgTransaction: 0,
        topSpendingCategory: 'No data yet',
        monthlyTrend: 'neutral'
      };
    }

    const userPhone = user?.phone_number;
    let totalSent = 0;
    let totalReceived = 0;
    const transactionCount = transactions.length;

    transactions.forEach(tx => {
      const amount = parseFloat(tx.amount);
      const isOutgoing = tx.sender === userPhone;
      
      if (isOutgoing) {
        totalSent += amount;
      } else {
        totalReceived += amount;
      }
    });

    const avgTransaction = transactionCount > 0 ? (totalSent + totalReceived) / transactionCount : 0;
    const netFlow = totalReceived - totalSent;
    const monthlyTrend = netFlow > 0 ? 'positive' : netFlow < 0 ? 'negative' : 'neutral';

    return {
      totalSent,
      totalReceived,
      transactionCount,
      avgTransaction,
      netFlow,
      monthlyTrend
    };
  };

  const insights = getFinancialInsights();

  const Card = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string, [key: string]: any }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl shadow-lg ${className}`}
      style={{ boxShadow: '0 4px 20px rgba(26, 27, 75, 0.1)', backgroundColor: COLORS.white }}
      {...props}
    >
      {children}
    </motion.div>
  );

  // Full page loading state
  if (!_hasHydrated || loading.wallet) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton width={200} height={36} className="mb-2" />
          <Skeleton width={180} height={20} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BalanceCardSkeleton />
          <QuickActionsSkeleton />
        </div>
        
        <RecentActivitySkeleton />
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
        className="flex justify-between items-start"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
            Welcome back, {user?.first_name || 'User'}!
          </h1>
          <p className="mt-1" style={{ color: COLORS.darkIndigo, minHeight: TYPED_TEXT_MIN_HEIGHTS.standard }}>
            <TypedText
              strings={TYPED_STRINGS.dashboard.welcome}
              speed={50}
              backSpeed={30}
              backDelay={3000}
              loop={true}
              showCursor={false}
            />
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-sm font-medium px-3 py-1 rounded-full transition-colors"
          style={{ 
            color: COLORS.gold,
            backgroundColor: isRefreshing ? COLORS.lightGray : 'transparent',
          }}
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="lg:col-span-2" style={{ 
          background: `linear-gradient(135deg, ${COLORS.indigo} 0%, ${COLORS.darkIndigo} 100%)`,
          color: COLORS.white
        }}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg opacity-90">Total Balance</p>
              {loading.wallet && (
                <Skeleton width={80} height={20} />
              )}
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            >
              <FiTrendingUp className="text-2xl" style={{ color: COLORS.gold }} />
            </motion.div>
          </div>
          <motion.p 
            className="text-4xl md:text-5xl font-bold mt-2"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {wallet.currency} {parseFloat(wallet.balance).toFixed(2)}
          </motion.p>
          
          {/* Quick Balance Insights */}
          {transactions && transactions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 grid grid-cols-2 gap-3"
            >
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <p className="text-xs opacity-70">This Month</p>
                <p className="text-lg font-bold" style={{ color: COLORS.mint }}>
                  +{wallet.currency} {insights.totalReceived.toFixed(2)}
                </p>
                <p className="text-xs opacity-70">Received</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                <p className="text-xs opacity-70">This Month</p>
                <p className="text-lg font-bold" style={{ color: COLORS.coral }}>
                  -{wallet.currency} {insights.totalSent.toFixed(2)}
                </p>
                <p className="text-xs opacity-70">Sent</p>
              </div>
            </motion.div>
          )}
          
          <div className="mt-8 flex flex-wrap gap-3 md:gap-4">
            <Link href="/send">
              <motion.div 
                whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(255, 194, 71, 0.3)' }} 
                whileTap={{ scale: 0.95 }} 
                className="flex cursor-pointer items-center gap-2 font-bold py-3 px-5 md:px-6 rounded-full shadow-md whitespace-nowrap"
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
                whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(51, 217, 178, 0.3)' }} 
                whileTap={{ scale: 0.95 }} 
                className="flex cursor-pointer items-center gap-2 font-bold py-3 px-5 md:px-6 rounded-full shadow-md whitespace-nowrap"
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
                href="/transfer" 
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-indigo-50 hover:scale-[1.02]"
                style={{ color: COLORS.darkIndigo }}
              >
                <motion.div whileHover={{ rotate: 15 }}>
                  <FiCreditCard className="text-lg" style={{ color: COLORS.mint }} />
                </motion.div>
                <span>Pay Merchant</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/cashout" 
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-indigo-50 hover:scale-[1.02]"
                style={{ color: COLORS.darkIndigo }}
              >
                <motion.div whileHover={{ rotate: 15 }}>
                  <FiBriefcase className="text-lg" style={{ color: COLORS.coral }} />
                </motion.div>
                <span>Cash Out</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/history" 
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-indigo-50 hover:scale-[1.02]"
                style={{ color: COLORS.darkIndigo }}
              >
                <motion.div whileHover={{ rotate: 15 }}>
                  <FiTrendingUp className="text-lg" style={{ color: COLORS.gold }} />
                </motion.div>
                <span>Transaction History</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/beneficiaries" 
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-indigo-50 hover:scale-[1.02]"
                style={{ color: COLORS.darkIndigo }}
              >
                <motion.div whileHover={{ rotate: 15 }}>
                  <FiUserPlus className="text-lg" style={{ color: COLORS.mint }} />
                </motion.div>
                <span>Add Beneficiary</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/referrals" 
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-indigo-50 hover:scale-[1.02]"
                style={{ color: COLORS.darkIndigo }}
              >
                <motion.div whileHover={{ rotate: 15 }}>
                  <FiGift className="text-lg" style={{ color: COLORS.gold }} />
                </motion.div>
                <span>Invite Friends</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/kyc" 
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-indigo-50 hover:scale-[1.02]"
                style={{ color: COLORS.darkIndigo }}
              >
                <motion.div whileHover={{ rotate: 15 }}>
                  <FiShield className="text-lg" style={{ color: COLORS.indigo }} />
                </motion.div>
                <span>KYC Verification</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/profile" 
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-indigo-50 hover:scale-[1.02]"
                style={{ color: COLORS.darkIndigo }}
              >
                <motion.div whileHover={{ rotate: 15 }}>
                  <FiUser className="text-lg" style={{ color: COLORS.coral }} />
                </motion.div>
                <span>My Profile</span>
              </Link>
            </li>
          </ul>
        </Card>
      </div>

      {/* Financial Insights Section */}
      {transactions && transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <h2 className="font-bold text-lg mb-4" style={{ color: COLORS.indigo }}>
              💡 Your Financial Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.lightGray }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mint }}>
                    <FiTrendingUp style={{ color: COLORS.white }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Net Flow</p>
                    <p className={`text-xl font-bold ${insights.monthlyTrend === 'positive' ? 'text-green-500' : insights.monthlyTrend === 'negative' ? 'text-red-500' : 'text-gray-500'}`}>
                      {insights.monthlyTrend === 'positive' ? '+' : insights.monthlyTrend === 'negative' ? '-' : ''}
                      {wallet.currency} {Math.abs(insights.netFlow || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {insights.monthlyTrend === 'positive' 
                    ? "You&apos;re receiving more than you&apos;re spending! 🎉" 
                    : insights.monthlyTrend === 'negative' 
                    ? "You&apos;re spending more than receiving this month"
                    : "Balanced spending this month"}
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.lightGray }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.gold }}>
                    <FiDollarSign style={{ color: COLORS.white }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Transaction</p>
                    <p className="text-xl font-bold" style={{ color: COLORS.indigo }}>
                      {wallet.currency} {insights.avgTransaction.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Your typical transaction size
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-4 rounded-xl"
                style={{ backgroundColor: COLORS.lightGray }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.coral }}>
                    <FiTrendingUp style={{ color: COLORS.white }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Transactions</p>
                    <p className="text-xl font-bold" style={{ color: COLORS.indigo }}>
                      {insights.transactionCount}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Activity this period
                </p>
              </motion.div>
            </div>

            {/* Personalized Recommendation */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-4 rounded-xl"
              style={{ backgroundColor: `${COLORS.mint}10`, border: `1px solid ${COLORS.mint}30` }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: COLORS.indigo }}>
                💎 Smart Tip
              </p>
              <p className="text-sm text-gray-600">
                {insights.monthlyTrend === 'negative' 
                  ? "Consider setting spending alerts to help manage your cash flow better."
                  : insights.totalReceived > 1000
                  ? "Great activity! Upgrade your KYC level to unlock higher transaction limits."
                  : "Invite friends to earn $5 per referral and grow your balance!"}
              </p>
            </motion.div>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity Card */}
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg" style={{ color: COLORS.indigo }}>Recent Activity</h2>
          <div className="flex items-center gap-2">
            {loading.transactions && (
              <Skeleton width={80} height={20} />
            )}
            <Link 
              href="/history" 
              className="text-sm font-medium"
              style={{ color: COLORS.gold }}
            >
              View All
            </Link>
          </div>
        </div>
        
        {loading.transactions ? (
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-4">
                  <Skeleton circle width={40} height={40} />
                  <div>
                    <Skeleton width={120} height={20} />
                    <Skeleton width={80} height={16} className="mt-1" />
                  </div>
                </div>
                <Skeleton width={60} height={20} />
              </div>
            ))}
          </div>
        ) : error.transactions ? (
          <div className="mt-4 text-center py-8 flex flex-col items-center justify-center" style={{ color: COLORS.coral }}>
            <FiAlertTriangle className="text-3xl opacity-50" />
            <p className="mt-2 font-semibold">{error.transactions}</p>
            <button 
              onClick={() => fetchTransactions()} 
              className="mt-2 text-sm font-bold py-1 px-3 rounded-full"
              style={{ 
                backgroundColor: COLORS.lightGray,
                color: COLORS.indigo
              }}
            >
              Try again
            </button>
          </div>
        ) : transactions.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {transactions.slice(0, 3).map((tx, index) => {
              // Determine if this is an outgoing or incoming transaction
              const userPhone = user?.phone_number;
              const isOutgoing = tx.sender === userPhone;
              
              return (
              <motion.li
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, backgroundColor: COLORS.lightGray }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg transition-all gap-2"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${isOutgoing ? 'bg-red-100' : 'bg-green-100'}`}>
                    {isOutgoing ? (
                      <FiArrowUpRight style={{ color: COLORS.coral }} />
                    ) : (
                      <FiArrowDownLeft style={{ color: COLORS.mint }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate" style={{ color: COLORS.darkIndigo }}>
                      {isOutgoing ? 'Sent to' : 'Received from'} {isOutgoing ? (tx.receiver || 'Unknown') : (tx.sender || 'Unknown')}
                    </p>
                    <p className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    {tx.transaction_reference && (
                      <p className="text-xs text-gray-400 mt-1">Ref: {tx.transaction_reference}</p>
                    )}
                  </div>
                </div>
                <p className={`font-bold flex-shrink-0 ${isOutgoing ? 'text-red-500' : 'text-green-500'}`}>
                  {isOutgoing ? '-' : '+'} {wallet.currency} {tx.amount}
                </p>
              </motion.li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4 text-center py-8" style={{ color: COLORS.darkIndigo }}>
            <FiTrendingUp className="mx-auto text-3xl opacity-30" />
            <p className="mt-2">Your recent transactions will appear here</p>
            <button 
              onClick={() => fetchTransactions()} 
              className="mt-4 text-sm font-medium py-2 px-4 rounded-full"
              style={{ 
                backgroundColor: COLORS.lightGray,
                color: COLORS.indigo
              }}
            >
              Check for new transactions
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}


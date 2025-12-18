'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiArrowDownLeft, FiAlertTriangle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useUserStore } from '@/lib/store/useUserStore';
import Link from 'next/link';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

const TransactionSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4, 5].map((item) => (
      <div key={item} className="flex items-center justify-between p-4 rounded-lg bg-white">
        <div className="flex items-center gap-4">
          <Skeleton circle width={40} height={40} />
          <div>
            <Skeleton width={150} height={20} />
            <Skeleton width={100} height={16} className="mt-1" />
          </div>
        </div>
        <Skeleton width={80} height={24} />
      </div>
    ))}
  </div>
);

export default function HistoryPage() {
  const {
    user,
    transactions,
    wallet,
    fetchTransactions,
    loading,
    error,
    currentPage,
    totalPages,
    totalTransactions,
    isAuthenticated,
    _hasHydrated,
  } = useUserStore();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      fetchTransactions(1);
    }
  }, [_hasHydrated, isAuthenticated, fetchTransactions]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchTransactions(page);
    }
  };

  if (!_hasHydrated || loading.transactions) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton width={250} height={36} />
          <Skeleton width={200} height={20} className="mt-2" />
        </div>
        <TransactionSkeleton />
      </div>
    );
  }

  if (error.transactions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FiAlertTriangle className="text-4xl" style={{ color: COLORS.coral }} />
        <p className="mt-4 text-lg" style={{ color: COLORS.indigo }}>
          Error: {error.transactions}
        </p>
        <button
          onClick={() => fetchTransactions(1)}
          className="mt-4 font-bold py-2 px-6 rounded-md transition-colors"
          style={{
            backgroundColor: COLORS.gold,
            color: COLORS.indigo,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
          Transaction History
        </h1>
        <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
          {totalTransactions > 0
            ? `You have ${totalTransactions} transactions`
            : 'Your transactions will appear here'}
        </p>
      </motion.div>

      {transactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.lightGray }}
          >
            <FiArrowUpRight className="text-3xl" style={{ color: COLORS.indigo, opacity: 0.3 }} />
          </div>
          <p className="text-lg" style={{ color: COLORS.darkIndigo }}>
            No transactions yet
          </p>
          <p className="text-sm mt-2" style={{ color: COLORS.darkIndigo, opacity: 0.7 }}>
            Your transaction history will appear here once you start using Ovii.
          </p>
          <Link href="/send">
            <button
              className="mt-6 font-bold py-3 px-8 rounded-full transition-colors"
              style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
            >
              Send Money
            </button>
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-3"
          >
            {transactions.map((tx, index) => {
              // Determine if this is an outgoing or incoming transaction
              // Check if the current user is the sender or receiver
              const userPhone = user?.phone_number;
              const isOutgoing = tx.sender === userPhone;
              const isIncoming = tx.receiver === userPhone;
              
              // Safety check: if neither matches, assume incoming to avoid confusion
              // (This shouldn't happen due to backend filtering, but handle it gracefully)
              const direction = isOutgoing ? 'outgoing' : 'incoming';
              
              // Determine display text based on transaction type and direction
              const getTransactionLabel = () => {
                if (isOutgoing) {
                  switch (tx.transaction_type) {
                    case 'TRANSFER':
                      return `Sent to ${tx.receiver || 'Unknown'}`;
                    case 'WITHDRAWAL':
                      return `Cash-out to ${tx.receiver || 'Agent'}`;
                    case 'PAYMENT':
                      return `Payment to ${tx.receiver || 'Merchant'}`;
                    case 'COMMISSION':
                      return 'Commission Fee';
                    default:
                      return `Sent ${tx.transaction_type}`;
                  }
                } else {
                  // Incoming transaction (or unclear - treat as incoming)
                  switch (tx.transaction_type) {
                    case 'TRANSFER':
                      return `Received from ${tx.sender || 'Unknown'}`;
                    case 'DEPOSIT':
                      return `Received from ${tx.sender || 'Agent'}`;
                    case 'PAYMENT':
                      return `Payment from ${tx.sender || 'Customer'}`;
                    default:
                      return `Received ${tx.transaction_type}`;
                  }
                }
              };

              return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow gap-3"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                      isOutgoing ? 'bg-red-100' : 'bg-green-100'
                    }`}
                  >
                    {isOutgoing ? (
                      <FiArrowUpRight style={{ color: COLORS.coral }} />
                    ) : (
                      <FiArrowDownLeft style={{ color: COLORS.mint }} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate" style={{ color: COLORS.darkIndigo }}>
                      {getTransactionLabel()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {tx.transaction_reference && (
                      <p className="text-xs text-gray-400 mt-1">Ref: {tx.transaction_reference}</p>
                    )}
                    {tx.description && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{tx.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p
                    className={`font-bold ${
                      isOutgoing ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    {isOutgoing ? '-' : '+'} {wallet?.currency}{' '}
                    {tx.amount}
                  </p>
                  <p
                    className="text-xs px-2 py-1 rounded-full inline-block mt-1"
                    style={{
                      backgroundColor:
                        tx.status === 'COMPLETED'
                          ? 'rgba(51, 217, 178, 0.1)'
                          : tx.status === 'PENDING'
                          ? 'rgba(255, 194, 71, 0.1)'
                          : 'rgba(255, 107, 107, 0.1)',
                      color:
                        tx.status === 'COMPLETED'
                          ? COLORS.mint
                          : tx.status === 'PENDING'
                          ? COLORS.gold
                          : COLORS.coral,
                    }}
                  >
                    {tx.status}
                  </p>
                </div>
              </motion.div>
              );
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 mt-8"
            >
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.lightGray, color: COLORS.indigo }}
              >
                <FiChevronLeft />
                Previous
              </button>
              <span className="text-sm" style={{ color: COLORS.darkIndigo }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.lightGray, color: COLORS.indigo }}
              >
                Next
                <FiChevronRight />
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

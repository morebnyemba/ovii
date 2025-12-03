'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FiDollarSign, FiMapPin, FiPhone, FiLoader, FiInfo } from 'react-icons/fi';
import { useUserStore } from '@/lib/store/useUserStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

const cashoutSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  pin: z.string().length(4, 'PIN must be 4 digits'),
});

type CashoutFormValues = z.infer<typeof cashoutSchema>;

export default function CashoutPage() {
  const { wallet, fetchWallet } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CashoutFormValues>({
    resolver: zodResolver(cashoutSchema),
  });

  const onSubmit = async (data: CashoutFormValues) => {
    setIsSubmitting(true);
    try {
      await api.post('/wallets/cashout/', data);
      fetchWallet();
      toast.success('Cash out request submitted successfully!');
      reset();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Cash out failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
          Cash Out
        </h1>
        <p className="mt-1" style={{ color: COLORS.darkIndigo, opacity: 0.8 }}>
          Withdraw funds from your wallet
        </p>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.indigo} 0%, ${COLORS.darkIndigo} 100%)`,
          color: COLORS.white
        }}
      >
        <p className="text-sm opacity-90">Available Balance</p>
        <p className="text-3xl font-bold mt-1">
          {wallet?.currency || 'USD'} {parseFloat(wallet?.balance || '0').toFixed(2)}
        </p>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl flex items-start gap-3"
        style={{ backgroundColor: `${COLORS.mint}15` }}
      >
        <FiInfo style={{ color: COLORS.mint }} className="text-xl flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium" style={{ color: COLORS.indigo }}>
            How to Cash Out
          </p>
          <p className="text-sm mt-1" style={{ color: COLORS.darkIndigo, opacity: 0.8 }}>
            Visit any Ovii agent location near you with your withdrawal code. The agent will process your cash withdrawal.
          </p>
        </div>
      </motion.div>

      {/* Cashout Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2" style={{ color: COLORS.indigo }}>
              Amount to Withdraw
            </label>
            <div className="relative">
              <FiDollarSign 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-xl"
                style={{ color: COLORS.indigo, opacity: 0.5 }}
              />
              <input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="0.00"
                className="w-full rounded-xl border-2 py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 transition duration-300"
                style={{
                  color: COLORS.indigo,
                  backgroundColor: COLORS.lightGray,
                  borderColor: errors.amount ? COLORS.coral : COLORS.mint,
                }}
              />
            </div>
            {errors.amount && (
              <p className="text-sm mt-1" style={{ color: COLORS.coral }}>{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="pin" className="block text-sm font-medium mb-2" style={{ color: COLORS.indigo }}>
              Transaction PIN
            </label>
            <input
              id="pin"
              type="password"
              maxLength={4}
              {...register('pin')}
              placeholder="••••"
              className="w-full rounded-xl border-2 py-4 px-4 text-lg text-center tracking-widest focus:outline-none focus:ring-2 transition duration-300"
              style={{
                color: COLORS.indigo,
                backgroundColor: COLORS.lightGray,
                borderColor: errors.pin ? COLORS.coral : COLORS.mint,
              }}
            />
            {errors.pin && (
              <p className="text-sm mt-1" style={{ color: COLORS.coral }}>{errors.pin.message}</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.indigo,
            }}
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin" />
                Processing...
              </>
            ) : (
              'Request Cash Out'
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Find Agent Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white p-6 rounded-2xl shadow-lg"
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.indigo }}>
          Find an Agent Near You
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.lightGray }}>
            <FiMapPin style={{ color: COLORS.mint }} className="text-xl" />
            <div>
              <p className="font-medium" style={{ color: COLORS.indigo }}>Agent Locator</p>
              <p className="text-sm" style={{ color: COLORS.darkIndigo, opacity: 0.7 }}>
                Find the nearest Ovii agent for cash out
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: COLORS.lightGray }}>
            <FiPhone style={{ color: COLORS.gold }} className="text-xl" />
            <div>
              <p className="font-medium" style={{ color: COLORS.indigo }}>Support Hotline</p>
              <p className="text-sm" style={{ color: COLORS.darkIndigo, opacity: 0.7 }}>
                Call *123# or 0800 OVII for assistance
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

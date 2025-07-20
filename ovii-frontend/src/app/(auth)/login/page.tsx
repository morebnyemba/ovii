'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FiPhone, FiLoader, FiAlertCircle, FiShield, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      triggerError('Please enter a valid phone number (e.g. +263 712 345 678)');
      return;
    }

    setLoading(true);

    try {
      const payload = { phone_number: '+' + cleaned };
      const res = await api.post('/users/otp/request/', payload);

      localStorage.setItem('phone_for_verification', '+' + cleaned);
      router.push('/verify-otp');
    } catch (err: any) {
      const detail =
        err.response?.data?.phone_number?.[0] ||
        err.response?.data?.detail ||
        'Failed to send OTP. Please try again later.';
      triggerError(detail);
    } finally {
      setLoading(false);
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,3})$/);
    if (match) {
      const [, p1, p2, p3, p4] = match;
      const parts = [p1, p2, p3, p4].filter(Boolean);
      const formatted = parts.length ? '+' + parts.join(' ') : '';
      setPhoneNumber(formatted);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center bg-gradient-to-br p-4 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${COLORS.darkIndigo} 0%, ${COLORS.mint} 100%)`,
      }}
    >
      <motion.div
        initial={{ y: isMounted ? 20 : 0, opacity: isMounted ? 0 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <motion.div
          animate={{ scale: shake ? [1, 0.98, 1.02, 1] : 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl bg-white p-6 shadow-2xl md:p-8"
          style={{ backgroundColor: COLORS.white }}
        >
          <div className="mb-6 text-center">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <FiZap className="text-2xl" style={{ color: COLORS.gold }} />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold md:text-4xl"
              style={{ color: COLORS.indigo }}
            >
              Welcome to Ovii
            </motion.h1>
            
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm opacity-80 md:text-base"
              style={{ color: COLORS.indigo }}
            >
              Your secure digital wallet for instant payments
            </motion.p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <label htmlFor="phone" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>
                Mobile Number
              </label>
              <div className="relative">
                <FiPhone
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xl"
                  style={{ color: COLORS.indigo }}
                />
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="+263 712 345 678"
                  maxLength={16}
                  required
                  className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 text-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    borderColor: COLORS.mint,
                    color: COLORS.indigo,
                    backgroundColor: COLORS.lightGray,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                We'll send a 6-digit verification code to this number
              </p>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3">
                    <FiAlertCircle className="text-red-500" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-lg font-semibold shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.indigo,
                }}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Securing your account...</span>
                  </>
                ) : (
                  'Continue Securely'
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <FiShield className="text-indigo-400" />
                <span>Bank-grade security encryption</span>
              </div>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 space-y-4 border-t pt-4"
          >
            <div className="text-center text-sm" style={{ color: COLORS.indigo }}>
              <p className="font-medium">New to Ovii?</p>
              <p className="text-xs opacity-80">Create an account to enjoy:</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 rounded bg-indigo-50 p-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: COLORS.mint }} />
                <span>Instant Transfers</span>
              </div>
              <div className="flex items-center gap-1 rounded bg-indigo-50 p-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: COLORS.gold }} />
                <span>Bill Payments</span>
              </div>
              <div className="flex items-center gap-1 rounded bg-indigo-50 p-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: COLORS.coral }} />
                <span>Mobile Airtime</span>
              </div>
              <div className="flex items-center gap-1 rounded bg-indigo-50 p-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: COLORS.indigo }} />
                <span>Secure Wallet</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center text-xs text-gray-500"
          >
            By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
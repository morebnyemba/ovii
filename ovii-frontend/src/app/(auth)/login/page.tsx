'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FiPhone, FiLoader, FiAlertCircle } from 'react-icons/fi';
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

  // Set mounted state for animations
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Client-side validation
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      triggerError('Please enter a valid phone number (e.g. +263 712 345 678)');
      return;
    }

    setLoading(true);

    try {
      const payload = { phone_number: '+' + cleaned };
      const res = await api.post('/users/otp/request/', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

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
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-900 to-teal-400 p-4 md:p-8"
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
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold md:text-4xl"
              style={{ color: COLORS.indigo }}
            >
              Welcome to Ovii
            </motion.h1>
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-2 text-sm opacity-80 md:text-base"
              style={{ color: COLORS.indigo }}
            >
              Enter your phone number to continue
            </motion.p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-4">
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <FiPhone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xl"
                style={{ color: COLORS.indigo }}
              />
              <input
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
                  focusRingColor: COLORS.gold,
                }}
              />
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
              transition={{ delay: 0.4 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-lg font-semibold shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.indigo,
                  focusRingColor: COLORS.mint,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center text-xs text-gray-500"
          >
            By continuing, you agree to our Terms of Service and Privacy Policy
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiLoader, FiAlertCircle, FiCheckCircle, FiShield } from 'react-icons/fi';
import api from '@/lib/api';
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

export default function SetPinPage() {
  // Form fields
  const [pin, setPin] = useState('');
  const [pinConfirmation, setPinConfirmation] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const { user, login } = useUserStore();

  useEffect(() => {
    setIsMounted(true);
    // If user is not logged in or has already set a PIN, redirect them.
    if (!user) {
      router.replace('/login');
    } else if (user.has_set_pin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const getApiErrorMessage = (err: any): string => {
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data.detail === 'string') return data.detail;
      const fieldName = Object.keys(data)[0];
      const firstError = data[fieldName];
      if (Array.isArray(firstError) && firstError.length > 0) {
        return firstError[0];
      }
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      triggerError('Your PIN must be 4 digits.');
      return;
    }

    if (pin !== pinConfirmation) {
      triggerError('PINs do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/users/me/set-pin/', { pin, pin_confirmation: pinConfirmation });
      const { tokens } = response.data;

      // The user object in the store is still valid, we just need to update the tokens
      // and re-persist the state with the new `has_set_pin` claim in the token.
      if (user && tokens) {
        login(user, tokens.access, tokens.refresh);
      }
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err: any) {
      triggerError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string, field: 'pin' | 'confirmation') => {
    if (/^\d{0,4}$/.test(value)) {
      if (field === 'pin') {
        setPin(value);
      } else {
        setPinConfirmation(value);
      }
    }
  };

  const renderPinForm = () => (
    <motion.form
      key="pin-form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleSetPin}
      className="space-y-6"
    >
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
        <label htmlFor="pin" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>Create a 4-Digit PIN</label>
        <div className="relative mt-1">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-xl" style={{ color: COLORS.indigo }} />
          <input id="pin" type="password" value={pin} onChange={(e) => handlePinChange(e.target.value, 'pin')} placeholder="****" maxLength={4} required className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.lightGray, letterSpacing: '0.5em' }} />
        </div>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
        <label htmlFor="pinConfirmation" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>Confirm PIN</label>
        <div className="relative mt-1">
          <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-xl" style={{ color: COLORS.indigo }} />
          <input id="pinConfirmation" type="password" value={pinConfirmation} onChange={(e) => handlePinChange(e.target.value, 'confirmation')} placeholder="****" maxLength={4} required className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.lightGray, letterSpacing: '0.5em' }} />
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 p-3">
              <FiAlertCircle className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-lg font-semibold shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80" style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}>
          {loading ? (
            <><FiLoader className="animate-spin" /><span>Setting PIN...</span></>
          ) : (
            'Set Transaction PIN'
          )}
        </button>
      </motion.div>
    </motion.form>
  );

  const renderSuccessMessage = () => (
    <motion.div
      key="success-message"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center"
    >
      <motion.div animate={{ scale: [1, 1.1, 1], transition: { duration: 0.5 } }} className="mb-6">
        <FiCheckCircle className="mx-auto text-5xl" style={{ color: COLORS.mint }} />
      </motion.div>
      <p className="text-lg" style={{ color: COLORS.indigo }}>
        PIN set successfully! Redirecting...
      </p>
    </motion.div>
  );

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
          {/* Header Section */}
          <div className="mb-6 text-center">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                {success ? (
                  <FiCheckCircle className="text-2xl" style={{ color: COLORS.mint }} />
                ) : (
                  <FiLock className="text-2xl" style={{ color: COLORS.gold }} />
                )}
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold md:text-4xl"
              style={{ color: COLORS.indigo }}
            >
              {success ? 'All Set!' : 'Secure Your Account'}
            </motion.h1>
            
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm opacity-80 md:text-base"
              style={{ color: COLORS.indigo }}
            >
              {success 
                ? 'Your account is now fully secured.' 
                : 'Create a 4-digit PIN to authorize transactions.'
              }
            </motion.p>
          </div>

          {/* Main Form Area */}
          <AnimatePresence mode="wait">
            {success 
              ? renderSuccessMessage()
              : renderPinForm()
            }
          </AnimatePresence>

          {/* Footer Section */}
          {!success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 border-t pt-4"
            >
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <FiShield className="text-indigo-400" />
                <span>This PIN is separate from your login code.</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.main>
  );
}

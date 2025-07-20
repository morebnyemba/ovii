'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FiPhone, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';

const OVII_INDIGO = '#1A1B4B';
const OVII_GOLD   = '#FFC247';
const OVII_MINT   = '#33D9B2';
const OVII_CORAL  = '#FF6B6B';
const OVII_WHITE  = '#FDFDFD';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake]   = useState(false);

  const router = useRouter();

  /* ------------------------------------------------------------------ */
  /* Handlers with heavy console logging                                 */
  /* ------------------------------------------------------------------ */
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    console.group('🔐 OTP Request');
    setError('');
    console.log('Raw phoneNumber entered:', phoneNumber);

    // --- Validation ----------------------------------------------------
    const cleaned = phoneNumber.replace(/\D/g, '');
    console.log('Digits only:', cleaned);
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      triggerError('Enter a valid phone number, e.g. +263 712 345 678');
      console.warn('❌ Validation failed');
      console.groupEnd();
      return;
    }
    console.log('✅ Validation passed');

    // --- Build payload -------------------------------------------------
    const payload = { phone: cleaned };
    console.log('Payload to send:', payload);

    setLoading(true);

    try {
      console.log('📤 POST /users/otp/request/');
      const res = await api.post('/users/otp/request/', payload, {
        // Force axios to send JSON (it usually does, but just in case)
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('📥 Response status:', res.status);
      console.log('📥 Response data:', res.data);

      // Persist phone for the verify page
      localStorage.setItem('phone_for_verification', cleaned);
      console.log('✅ Redirecting to /verify-otp');
      router.push('/verify-otp');
    } catch (err: any) {
      console.error('❌ Axios error object:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error message:', err.message);

      // Exact server message if available
      const detail =
        err.response?.data?.phone?.[0] ||
        err.response?.data?.detail ||
        'Couldn’t send OTP. Try again.';
      triggerError(detail);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const triggerError = (msg: string) => {
    console.warn('🚨 Triggering error:', msg);
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  /* ------------------------------------------------------------------ */
  /* Phone formatter (auto-spacing)                                      */
  /* ------------------------------------------------------------------ */
  const handleChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,3})$/);
    if (match) {
      const [, p1, p2, p3, p4] = match;
      const parts = [p1, p2, p3, p4].filter(Boolean);
      const formatted = parts.length ? '+' + parts.join(' ') : '';
      console.log('Phone formatter:', { raw: v, formatted });
      setPhoneNumber(formatted);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                             */
  /* ------------------------------------------------------------------ */
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1A1B4B] to-[#33D9B2] p-4">
      <motion.div
        animate={{ scale: shake ? [1, 0.97, 1.03, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm rounded-2xl bg-[#FDFDFD] p-8 shadow-2xl"
      >
        <h1 className="mb-2 text-center text-3xl font-bold" style={{ color: OVII_INDIGO }}>
          Welcome to Ovii
        </h1>
        <p className="mb-6 text-center text-sm opacity-80" style={{ color: OVII_INDIGO }}>
          Enter your phone number to continue.
        </p>

        <form onSubmit={handleSendOTP} className="space-y-6">
          <div className="relative">
            <FiPhone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xl"
              style={{ color: OVII_INDIGO }}
            />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="+263 712 345 678"
              maxLength={16}
              required
              className="w-full rounded-md border border-gray-300 bg-transparent py-3 pl-10 pr-3 text-lg focus:outline-none focus:ring-2"
              style={{ borderColor: OVII_MINT, color: OVII_INDIGO }}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm"
              style={{ color: OVII_CORAL }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md py-3 text-lg font-semibold transition-transform active:scale-95"
            style={{
              backgroundColor: OVII_GOLD,
              color: OVII_INDIGO,
            }}
          >
            {loading ? (
              <>
                <FiLoader className="animate-spin" />
                Sending…
              </>
            ) : (
              'Send OTP'
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
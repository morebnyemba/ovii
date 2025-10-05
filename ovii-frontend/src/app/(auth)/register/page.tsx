'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiPhone, FiLoader, FiAlertCircle, FiShield, FiCheckCircle, FiArrowLeft, FiZap, FiMail } from 'react-icons/fi';
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

export default function RegisterPage() {
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const router = useRouter();
  const { login, setTokens } = useUserStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const getApiErrorMessage = (err: any): string => {
    if (err.response?.data) {
      const data = err.response.data;
      if (typeof data.detail === 'string') return data.detail;
      const fieldName = Object.keys(data)[0];
      const firstError = data[fieldName];
      if (Array.isArray(firstError) && firstError.length > 0) {
        const formattedFieldName = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return fieldName === 'non_field_errors' ? firstError[0] : `${formattedFieldName}: ${firstError[0]}`;
      }
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        email: email || undefined,
      };
      const response = await api.post('/users/register/', payload);
      setRequestId(response.data.request_id);
      setStep(2);
      setCountdown(30);
    } catch (err: any) {
      triggerError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      triggerError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        request_id: requestId,
        code: otp,
      };
      const response = await api.post('/users/verify/', payload);
      const { user, tokens } = response.data;

      setTokens(tokens.access, tokens.refresh);
      login(user);

      setVerificationSuccess(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      triggerError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendLoading || countdown > 0) return;
    setError('');
    setResendLoading(true);
    try {
      // Re-request OTP for the same phone number
      const response = await api.post('/users/otp/request/', { phone_number: phoneNumber });
      setRequestId(response.data.request_id);
      setCountdown(30);
    } catch (err: any) {
      triggerError(getApiErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  const handlePhoneChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,3})$/);
    if (match) {
        const [, p1, p2, p3, p4] = match;
        const parts = [p1, p2, p3, p4].filter(Boolean);
        const formatted = parts.length ? '+' + parts.join(' ') : '';
        setPhoneNumber(formatted);
    }
  };

  const handleOtpChange = (value: string) => {
    if (/^\d{0,6}$/.test(value)) {
        setOtp(value);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setOtp('');
    setError('');
  };

  const renderRegistrationForm = () => (
    <motion.form
      key="register-form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleRegister}
      className="space-y-4"
    >
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>First Name</label>
          <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1 w-full rounded-lg border-2 bg-transparent py-3 px-3 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.lightGray }} />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>Last Name</label>
          <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1 w-full rounded-lg border-2 bg-transparent py-3 px-3 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.lightGray }} />
        </div>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
        <label htmlFor="phone" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>Mobile Number</label>
        <div className="relative mt-1">
          <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-xl" style={{ color: COLORS.indigo }} />
          <input id="phone" type="tel" value={phoneNumber} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="+263 712 345 678" maxLength={16} required className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 text-lg focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.lightGray }} />
        </div>
      </motion.div>

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
        <label htmlFor="email" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>Email (Optional)</label>
        <div className="relative mt-1">
          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-xl" style={{ color: COLORS.indigo }} />
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 text-lg focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.lightGray }} />
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

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-lg font-semibold shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80" style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}>
          {loading ? (
            <><FiLoader className="animate-spin" /><span>Creating Account...</span></>
          ) : (
            'Create Account'
          )}
        </button>
      </motion.div>
    </motion.form>
  );

  const renderOtpForm = () => (
    <motion.form
      key="otp-form"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onSubmit={handleVerifyOTP}
      className="space-y-4"
    >
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-2">
        <div className="flex items-center justify-between">
          <button type="button" onClick={resetFlow} className="flex items-center gap-1 text-sm" style={{ color: COLORS.indigo }}>
            <FiArrowLeft />
            Back
          </button>
          {countdown > 0 ? (
            <span className="text-xs text-gray-500">Resend in {countdown}s</span>
          ) : (
            <button type="button" onClick={handleResendOTP} disabled={resendLoading} className="flex items-center gap-1 text-xs underline disabled:cursor-not-allowed disabled:opacity-70" style={{ color: COLORS.mint }}>
              {resendLoading && <FiLoader className="animate-spin" />}
              {resendLoading ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="otp" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>Verification Code</label>
          <div className="relative">
            <input id="otp" type="tel" value={otp} onChange={(e) => handleOtpChange(e.target.value)} placeholder="123456" maxLength={6} required className="w-full rounded-lg border-2 bg-transparent py-3 px-4 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.lightGray, letterSpacing: '0.5em' }} />
          </div>
          <p className="text-xs text-gray-500">Enter the 6-digit code sent to your phone</p>
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

      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-lg font-semibold shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-80" style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}>
          {loading ? (
            <><FiLoader className="animate-spin" /><span>Verifying...</span></>
          ) : (
            'Verify & Create Account'
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
        Redirecting to your dashboard...
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
                {verificationSuccess ? (
                  <FiCheckCircle className="text-2xl" style={{ color: COLORS.mint }} />
                ) : (
                  <FiZap className="text-2xl" style={{ color: COLORS.gold }} />
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
              {verificationSuccess ? 'Welcome!' : step === 1 ? 'Create an Account' : 'Verify Your Number'}
            </motion.h1>
            
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm opacity-80 md:text-base"
              style={{ color: COLORS.indigo }}
            >
              {verificationSuccess 
                ? 'Your account has been created.' 
                : step === 1
                  ? 'Join Ovii for instant, secure payments.'
                  : `Enter the code sent to ${phoneNumber}`
              }
            </motion.p>
          </div>

          {/* Main Form Area */}
          <AnimatePresence mode="wait">
            {verificationSuccess 
              ? renderSuccessMessage()
              : step === 1 
                ? renderRegistrationForm() 
                : renderOtpForm()
            }
          </AnimatePresence>

          {/* Footer Section */}
          {!verificationSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 border-t pt-4"
            >
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <FiShield className="text-indigo-400" />
                <span>Bank-grade security encryption</span>
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                Already have an account? <a href="/login" className="underline font-semibold" style={{color: COLORS.mint}}>Log in</a>
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPhone, 
  FiLoader, 
  FiAlertCircle, 
  FiShield, 
  FiCheckCircle, 
  FiArrowLeft, 
  FiZap,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import api from '@/lib/api';
import { useUserStore } from '@/lib/store/useUserStore';

const COLORS = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e',
  },
  accent: {
    500: '#f59e0b',
    600: '#d97706',
  },
  success: '#10b981',
  error: '#ef4444',
  background: '#0f172a',
  surface: '#1e293b',
  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
  }
};

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showOtp, setShowOtp] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number; x: number; y: number; size: number; duration: number}>>([]);
  
  const router = useRouter();
  const { login, setTokens } = useUserStore();

  useEffect(() => {
    setIsMounted(true);
    // Create floating particles
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10
    }));
    setParticles(newParticles);
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
        triggerError('Please enter a valid phone number (e.g., +263712345678).');
        return;
    }
    setLoading(true);
    try {
        const response = await api.post('/users/otp/request/', { phone_number: phoneNumber });
        setRequestId(response.data.request_id);
        setOtpSent(true);
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
      const response = await api.post('/users/auth/login/', payload);
      const { user, tokens } = response.data;

      if (tokens) setTokens(tokens.access, tokens.refresh);
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
      const cleaned = phoneNumber.replace(/\D/g, '');
      const response = await api.post('/users/otp/request/', { phone_number: `+${cleaned}` });
      setRequestId(response.data.request_id);
      setCountdown(30);
    } catch (err: any) {
      triggerError(getApiErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
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

  const handleOtpChange = (value: string) => {
    if (/^\d{0,6}$/.test(value)) {
        setOtp(value);
    }
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex min-h-screen items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.primary[900]} 100%)`,
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-white/10"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Glow Effects */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-1/4 -left-10 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: COLORS.primary[500] }}
        />
        <div 
          className="absolute bottom-1/4 -right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: COLORS.accent[500] }}
        />
      </div>

      <motion.div
        initial={{ y: isMounted ? 20 : 0, opacity: isMounted ? 0 : 1 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          animate={{ scale: shake ? [1, 0.98, 1.02, 1] : 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl backdrop-blur-xl border border-white/10 p-8 shadow-2xl"
          style={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header Section */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur opacity-75 animate-pulse"></div>
                <div 
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: COLORS.surface }}
        >
                  {verificationSuccess ? (
                    <FiCheckCircle className="text-3xl" style={{ color: COLORS.success }} />
                  ) : (
                    <FiZap className="text-3xl" style={{ color: COLORS.accent[500] }} />
                  )}
                </div>
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3"
            >
              {verificationSuccess ? 'Verified!' : 'Welcome to Ovii'}
            </motion.h1>
            
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg opacity-80"
              style={{ color: COLORS.text.secondary }}
            >
              {verificationSuccess 
                ? 'Your account is now secure' 
                : otpSent 
                  ? `Enter the code sent to ${phoneNumber}` 
                  : 'Your secure digital wallet for instant payments'}
            </motion.p>
          </div>

          {/* Main Form Area */}
          <AnimatePresence mode="wait">
            {!otpSent && !verificationSuccess ? (
              <motion.form
                key="phone-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSendOTP}
                className="space-y-6"
              >
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3"
                >
                  <label htmlFor="phone" className="block text-sm font-medium" style={{ color: COLORS.text.primary }}>
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                    <div className="relative">
                      <FiPhone
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-xl z-10"
                        style={{ color: COLORS.primary[500] }}
                      />
                      <input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder="+263 712 345 678"
                        maxLength={16}
                        required
                        className="w-full rounded-xl border-0 bg-white/5 py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 backdrop-blur-sm transition duration-300"
                        style={{
                          color: COLORS.text.primary,
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: COLORS.text.secondary }}>
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
                      <div 
                        className="flex items-center gap-3 rounded-xl p-4"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                      >
                        <FiAlertCircle className="flex-shrink-0" style={{ color: COLORS.error }} />
                        <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <FiLoader className="animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <FiZap className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </div>
                  </button>
                </motion.div>
              </motion.form>
            ) : !verificationSuccess ? (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyOTP}
                className="space-y-6"
              >
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={resetOtpFlow}
                      className="flex items-center gap-2 text-sm transition-colors hover:text-blue-400"
                      style={{ color: COLORS.text.secondary }}
                    >
                      <FiArrowLeft />
                      Change number
                    </button>
                    {countdown > 0 ? (
                      <span className="text-sm" style={{ color: COLORS.text.secondary }}>
                        Resend in <span style={{ color: COLORS.accent[500] }}>{countdown}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendLoading}
                        className="flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
                        style={{ color: COLORS.primary[500] }}
                      >
                        {resendLoading && <FiLoader className="animate-spin" />}
                        {resendLoading ? 'Sending...' : 'Resend code'}
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="otp" className="block text-sm font-medium" style={{ color: COLORS.text.primary }}>
                      Verification Code
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
                      <div className="relative flex items-center">
                        <input
                          id="otp"
                          type={showOtp ? "text" : "tel"}
                          value={otp}
                          onChange={(e) => handleOtpChange(e.target.value)}
                          placeholder="••••••"
                          maxLength={6}
                          required
                          className="w-full rounded-xl border-0 bg-white/5 py-4 px-4 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 backdrop-blur-sm"
                          style={{
                            color: COLORS.text.primary,
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            letterSpacing: '0.5em',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowOtp(!showOtp)}
                          className="absolute right-4 text-lg transition-colors"
                          style={{ color: COLORS.text.secondary }}
                        >
                          {showOtp ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm" style={{ color: COLORS.text.secondary }}>
                      Enter the 6-digit code sent to your phone
                    </p>
                  </div>
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
                      <div 
                        className="flex items-center gap-3 rounded-xl p-4"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                      >
                        <FiAlertCircle className="flex-shrink-0" style={{ color: COLORS.error }} />
                        <p className="text-sm" style={{ color: COLORS.error }}>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <FiLoader className="animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Continue</span>
                          <FiCheckCircle className="transition-transform group-hover:scale-110" />
                        </>
                      )}
                    </div>
                  </button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    transition: { duration: 0.5 }
                  }}
                  className="mb-6"
                >
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-50 animate-ping"></div>
                    <FiCheckCircle 
                      className="relative text-6xl z-10" 
                      style={{ color: COLORS.success }} 
                    />
                  </div>
                </motion.div>
                <motion.p 
                  className="text-xl mb-2 font-semibold"
                  style={{ color: COLORS.text.primary }}
                >
                  Verification Successful!
                </motion.p>
                <motion.p 
                  className="text-lg opacity-80"
                  style={{ color: COLORS.text.secondary }}
                >
                  Redirecting to your dashboard...
                </motion.p>
                <motion.div 
                  className="mt-6 w-full bg-white/10 rounded-full h-2 overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'linear' }}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    style={{ width: '100%' }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Section */}
          {!verificationSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 border-t border-white/10 pt-6"
            >
              <div className="flex items-center justify-center gap-3 text-sm" style={{ color: COLORS.text.secondary }}>
                <FiShield style={{ color: COLORS.primary[500] }} />
                <span>Bank-grade security encryption</span>
              </div>
              <p className="mt-3 text-center text-xs" style={{ color: COLORS.text.secondary }}>
                By continuing, you agree to our{' '}
                <a href="#" className="underline transition-colors hover:text-blue-400">Terms</a>{' '}
                and{' '}
                <a href="#" className="underline transition-colors hover:text-blue-400">Privacy Policy</a>
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
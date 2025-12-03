'use client';

import { useState, useEffect, Suspense } from 'react';
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
  FiMail,
  FiUser,
  FiEye,
  FiEyeOff,
  FiGift
} from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useUserStore } from '@/lib/store/useUserStore';
import { useCsrf } from '@/hooks/useCsrf';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
  
  shades: {
    indigo: {
      light: '#2A2B6B',
      dark: '#0A0B2B',
    },
    gold: {
      light: '#FFD247',
      dark: '#E6AE30',
    },
    mint: {
      light: '#44E9C2',
      dark: '#22C9A2',
    },
    coral: {
      light: '#FF7B7B',
      dark: '#E65B5B',
    }
  }
};

// Referral code validation constants
const REFERRAL_CODE_MAX_LENGTH = 10;
const REFERRAL_CODE_PATTERN = /^[A-Z0-9]+$/;

function RegisterPageContent() {
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const searchParams = useSearchParams();

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
  const [particles, setParticles] = useState<Array<{id: number; x: number; y: number; size: number; duration: number}>>([]);

  const router = useRouter();
  const { login } = useUserStore();

  // Validate and sanitize referral code
  const sanitizeReferralCode = (code: string): string => {
    const sanitized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return sanitized.slice(0, REFERRAL_CODE_MAX_LENGTH);
  };

  // Ensure the CSRF token is fetched and set in the browser on component mount.
  useCsrf();

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

    // Check for referral code in URL parameters
    const refCode = searchParams?.get('ref');
    if (refCode) {
      const sanitized = sanitizeReferralCode(refCode);
      if (sanitized && REFERRAL_CODE_PATTERN.test(sanitized)) {
        setReferralCode(sanitized);
      }
    }
  }, [searchParams]);

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
    
    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      triggerError('Please enter your first and last name');
      return;
    }

    const cleaned = phoneNumber.replace(/\D/g, '');
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      triggerError('Please enter a valid phone number (e.g., +263712345678).');
      return;
    }

    setLoading(true);

    try {
      const payload: {
        first_name: string;
        last_name: string;
        phone_number: string;
        email?: string;
        referral_code?: string;
      } = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber,
        email: email.trim() || undefined,
      };
      
      // Include referral code if provided
      if (referralCode.trim()) {
        payload.referral_code = referralCode.trim().toUpperCase();
      }
      
      const response = await api.post('/users/register/start/', payload);
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
      const response = await api.post('/users/auth/register/', payload);
      const { user, tokens } = response.data;

      login(user, tokens.access, tokens.refresh);

      setVerificationSuccess(true);
      setTimeout(() => router.push('/set-pin'), 1500);
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onSubmit={handleRegister}
      className="space-y-6"
    >
      {/* Name Fields */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-4"
      >
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>
            First Name
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative">
              <FiUser
                className="absolute left-3 top-1/2 -translate-y-1/2 text-lg z-10"
                style={{ color: COLORS.indigo }}
              />
              <input 
                id="firstName" 
                type="text" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                required 
                className="w-full rounded-xl border-0 bg-white/5 py-3 pl-10 pr-3 focus:outline-none focus:ring-2 backdrop-blur-sm transition duration-300"
                style={{
                  color: COLORS.indigo,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                placeholder="John"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>
            Last Name
          </label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative">
              <FiUser
                className="absolute left-3 top-1/2 -translate-y-1/2 text-lg z-10"
                style={{ color: COLORS.indigo }}
              />
              <input 
                id="lastName" 
                type="text" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                required 
                className="w-full rounded-xl border-0 bg-white/5 py-3 pl-10 pr-3 focus:outline-none focus:ring-2 backdrop-blur-sm transition duration-300"
                style={{
                  color: COLORS.indigo,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                placeholder="Doe"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Phone Number */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-2"
      >
        <label htmlFor="phone" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>
          Mobile Number
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative">
            <FiPhone
              className="absolute left-3 top-1/2 -translate-y-1/2 text-xl z-10"
              style={{ color: COLORS.indigo }}
            />
            <input 
              id="phone" 
              type="tel" 
              value={phoneNumber} 
              onChange={(e) => handlePhoneChange(e.target.value)} 
              placeholder="+263 712 345 678" 
              maxLength={16} 
              required 
              className="w-full rounded-xl border-0 bg-white/5 py-3 pl-10 pr-3 text-lg focus:outline-none focus:ring-2 backdrop-blur-sm transition duration-300"
              style={{
                color: COLORS.indigo,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </div>
        <p className="text-sm" style={{ color: COLORS.indigo, opacity: 0.7 }}>
          We'll send a 6-digit verification code to this number
        </p>
      </motion.div>

      {/* Email */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-2"
      >
        <label htmlFor="email" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>
          Email (Optional)
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative">
            <FiMail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-lg z-10"
              style={{ color: COLORS.indigo }}
            />
            <input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
              className="w-full rounded-xl border-0 bg-white/5 py-3 pl-10 pr-3 focus:outline-none focus:ring-2 backdrop-blur-sm transition duration-300"
              style={{
                color: COLORS.indigo,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Referral Code */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="space-y-2"
      >
        <label htmlFor="referralCode" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>
          Referral Code (Optional)
        </label>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative">
            <FiGift
              className="absolute left-3 top-1/2 -translate-y-1/2 text-lg z-10"
              style={{ color: COLORS.gold }}
            />
            <input 
              id="referralCode" 
              type="text" 
              value={referralCode} 
              onChange={(e) => setReferralCode(sanitizeReferralCode(e.target.value))} 
              placeholder="Enter referral code" 
              maxLength={REFERRAL_CODE_MAX_LENGTH}
              className="w-full rounded-xl border-0 bg-white/5 py-3 pl-10 pr-3 focus:outline-none focus:ring-2 backdrop-blur-sm transition duration-300 uppercase"
              style={{
                color: COLORS.indigo,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
          </div>
        </div>
        {referralCode && (
          <p className="text-sm" style={{ color: COLORS.mint }}>
            🎁 You&apos;ll receive a bonus when you complete registration!
          </p>
        )}
      </motion.div>

      {/* Error Message */}
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
              style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)' }}
            >
              <FiAlertCircle className="flex-shrink-0" style={{ color: COLORS.coral }} />
              <p className="text-sm" style={{ color: COLORS.coral }}>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <FiZap className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </div>
        </button>
      </motion.div>
    </motion.form>
  );

  const renderOtpForm = () => (
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
            onClick={resetFlow}
            className="flex items-center gap-2 text-sm transition-colors hover:text-blue-400"
            style={{ color: COLORS.indigo }}
          >
            <FiArrowLeft />
            Back to details
          </button>
          {countdown > 0 ? (
            <span className="text-sm" style={{ color: COLORS.indigo, opacity: 0.7 }}>
              Resend in <span style={{ color: COLORS.gold }}>{countdown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="flex items-center gap-2 text-sm transition-colors disabled:opacity-50"
              style={{ color: COLORS.mint }}
            >
              {resendLoading && <FiLoader className="animate-spin" />}
              {resendLoading ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </div>

        <div className="space-y-3">
          <label htmlFor="otp" className="block text-sm font-medium" style={{ color: COLORS.indigo }}>
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
                  color: COLORS.indigo,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  letterSpacing: '0.5em',
                }}
              />
              <button
                type="button"
                onClick={() => setShowOtp(!showOtp)}
                className="absolute right-4 text-lg transition-colors"
                style={{ color: COLORS.indigo, opacity: 0.7 }}
              >
                {showOtp ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          <p className="text-sm" style={{ color: COLORS.indigo, opacity: 0.7 }}>
            Enter the 6-digit code sent to {phoneNumber}
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
              style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)' }}
            >
              <FiAlertCircle className="flex-shrink-0" style={{ color: COLORS.coral }} />
              <p className="text-sm" style={{ color: COLORS.coral }}>{error}</p>
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
                <span>Verify & Create Account</span>
                <FiCheckCircle className="transition-transform group-hover:scale-110" />
              </>
            )}
          </div>
        </button>
      </motion.div>
    </motion.form>
  );

  const renderSuccessMessage = () => (
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
          <div 
            className="absolute inset-0 rounded-full blur-xl opacity-50 animate-ping"
            style={{ backgroundColor: COLORS.mint }}
          ></div>
          <FiCheckCircle 
            className="relative text-6xl z-10" 
            style={{ color: COLORS.mint }} 
          />
        </div>
      </motion.div>
      <motion.p 
        className="text-xl mb-2 font-semibold"
        style={{ color: COLORS.indigo }}
      >
        Welcome to Ovii!
      </motion.p>
      <motion.p 
        className="text-lg opacity-80 mb-6"
        style={{ color: COLORS.indigo }}
      >
        Your account has been created successfully
      </motion.p>
      <motion.div 
        className="w-full rounded-full h-2 overflow-hidden"
        style={{ backgroundColor: COLORS.lightGray }}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1.5, ease: 'linear' }}
      >
        <div 
          className="h-full rounded-full"
          style={{ 
            backgroundColor: COLORS.mint,
            width: '100%' 
          }}
        />
      </motion.div>
    </motion.div>
  );

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex min-h-screen items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${COLORS.darkIndigo} 0%, ${COLORS.indigo} 50%, ${COLORS.mint} 100%)`,
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
          style={{ backgroundColor: COLORS.mint }}
        />
        <div 
          className="absolute bottom-1/4 -right-10 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: COLORS.gold }}
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
            backgroundColor: 'rgba(253, 253, 253, 0.95)',
            boxShadow: '0 25px 50px -12px rgba(26, 27, 75, 0.5)',
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
                <div 
                  className="absolute inset-0 rounded-2xl blur opacity-75 animate-pulse"
                  style={{ backgroundColor: COLORS.mint }}
                ></div>
                <div 
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: COLORS.indigo }}
                >
                  {verificationSuccess ? (
                    <FiCheckCircle className="text-3xl" style={{ color: COLORS.mint }} />
                  ) : (
                    <FiZap className="text-3xl" style={{ color: COLORS.gold }} />
                  )}
                </div>
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold mb-3"
              style={{ color: COLORS.indigo }}
            >
              {verificationSuccess 
                ? 'Welcome!' 
                : step === 1 
                  ? 'Join Ovii Today' 
                  : 'Verify Your Number'
              }
            </motion.h1>
            
            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg opacity-80"
              style={{ color: COLORS.indigo }}
            >
              {verificationSuccess 
                ? 'Your account has been created successfully' 
                : step === 1
                  ? 'Create your account for instant, secure payments'
                  : `Enter the code sent to ${phoneNumber}`
              }
            </motion.p>
          </div>

          {/* Progress Steps */}
          {!verificationSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center mb-8"
            >
              <div className="flex items-center space-x-4">
                {[1, 2].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step >= stepNumber ? 'text-white scale-110' : 'text-gray-400'
                      }`}
                      style={{
                        backgroundColor: step >= stepNumber ? COLORS.mint : COLORS.lightGray,
                      }}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 2 && (
                      <div 
                        className={`w-12 h-1 mx-2 transition-all ${
                          step > stepNumber ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

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
              className="mt-8 border-t pt-6"
              style={{ borderColor: COLORS.lightGray }}
            >
              <div className="flex items-center justify-center gap-3 text-sm" style={{ color: COLORS.indigo, opacity: 0.7 }}>
                <FiShield style={{ color: COLORS.mint }} />
                <span>Bank-grade security encryption</span>
              </div>
              <p className="mt-3 text-center text-sm" style={{ color: COLORS.indigo, opacity: 0.7 }}>
                Already have an account?{' '}
                <a 
                  href="/login" 
                  className="font-semibold transition-colors hover:text-blue-600"
                  style={{ color: COLORS.mint }}
                >
                  Log in
                </a>
              </p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: COLORS.darkIndigo }}>
        <FiLoader className="animate-spin text-4xl" style={{ color: COLORS.gold }} />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
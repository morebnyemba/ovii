"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@/lib/store/useUserStore';
import { motion } from 'framer-motion';
import { FiUsers, FiGift, FiCopy, FiCheck, FiShare2, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
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

interface ReferralStats {
  referral_code: string | null;
  total_referrals: number;
  credited_referrals: number;
  pending_referrals: number;
  total_earnings: number | string;
}

interface Referral {
  id: number;
  referrer_phone: string;
  referred_phone: string;
  referred_name: string;
  referral_code: string;
  referrer_bonus: string;
  referred_bonus: string;
  bonus_status: 'PENDING' | 'CREDITED' | 'EXPIRED';
  created_at: string;
  credited_at: string | null;
}

const ReferralSkeleton = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div>
        <Skeleton width={250} height={40} />
        <Skeleton width={300} height={20} className="mt-2" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 rounded-2xl shadow-lg bg-white">
          <Skeleton width={120} height={20} />
          <Skeleton width={80} height={36} className="mt-2" />
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <Skeleton width={200} height={24} />
      <Skeleton height={60} className="mt-4" />
    </div>
  </div>
);

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-2xl shadow-lg"
  >
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="text-lg" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold" style={{ color: COLORS.indigo }}>{value}</p>
      </div>
    </div>
  </motion.div>
);

const getBonusStatusColor = (status: string) => {
  switch (status) {
    case 'CREDITED':
      return COLORS.mint;
    case 'PENDING':
      return COLORS.gold;
    case 'EXPIRED':
      return COLORS.coral;
    default:
      return COLORS.darkIndigo;
  }
};

const getBonusStatusIcon = (status: string) => {
  switch (status) {
    case 'CREDITED':
      return FiCheckCircle;
    case 'PENDING':
      return FiClock;
    default:
      return FiClock;
  }
};

export default function ReferralsPage() {
  const { _hasHydrated, isAuthenticated, user } = useUserStore();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchReferralData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const [statsResponse, referralsResponse] = await Promise.all([
        api.get('/users/me/referrals/stats/'),
        api.get('/users/me/referrals/'),
      ]);
      setStats(statsResponse.data);
      setReferrals(referralsResponse.data);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      fetchReferralData();
    }
  }, [_hasHydrated, isAuthenticated, fetchReferralData]);

  const generateReferralCode = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/users/me/referral-code/generate/');
      setStats(prev => prev ? { ...prev, referral_code: response.data.referral_code } : null);
      toast.success('Referral code generated successfully!');
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      toast.error('Failed to generate referral code');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!stats?.referral_code) return;
    
    try {
      await navigator.clipboard.writeText(stats.referral_code);
      setCopied(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy referral code:', error);
      toast.error('Failed to copy referral code');
    }
  };

  const shareReferralCode = async () => {
    if (!stats?.referral_code) return;
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ovii.it.com';
    const shareData = {
      title: 'Join Ovii',
      text: `Join Ovii using my referral code: ${stats.referral_code} and get a welcome bonus!`,
      url: `${appUrl}/register?ref=${stats.referral_code}`,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // AbortError is thrown when user cancels - this is expected behavior
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fallback to copy
      await copyToClipboard();
    }
  };

  if (!_hasHydrated || loading) {
    return <ReferralSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p>Please log in to view your referrals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
          Referral Program
        </h1>
        <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
          Invite friends to Ovii and earn rewards together!
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={FiUsers} 
          label="Total Referrals" 
          value={stats?.total_referrals || 0} 
          color={COLORS.indigo} 
        />
        <StatCard 
          icon={FiCheckCircle} 
          label="Credited" 
          value={stats?.credited_referrals || 0} 
          color={COLORS.mint} 
        />
        <StatCard 
          icon={FiClock} 
          label="Pending" 
          value={stats?.pending_referrals || 0} 
          color={COLORS.gold} 
        />
        <StatCard 
          icon={FiDollarSign} 
          label="Total Earnings" 
          value={`$${stats?.total_earnings || '0.00'}`} 
          color={COLORS.mint} 
        />
      </div>

      {/* Rewards Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="p-6 rounded-2xl shadow-lg"
        style={{ 
          background: `linear-gradient(135deg, ${COLORS.indigo} 0%, ${COLORS.darkIndigo} 100%)`,
          color: COLORS.white
        }}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
            className="inline-block"
          >
            <FiGift className="text-5xl mx-auto mb-4" style={{ color: COLORS.gold }} />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Earn $5 for Every Friend You Refer!
          </h2>
          <p className="text-lg opacity-90 mb-4">
            Your friends get $2 welcome bonus too!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl text-center">
              <p className="text-3xl font-bold" style={{ color: COLORS.gold }}>$5</p>
              <p className="text-sm opacity-80">You Earn</p>
            </div>
            <div className="text-2xl opacity-60">+</div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl text-center">
              <p className="text-3xl font-bold" style={{ color: COLORS.mint }}>$2</p>
              <p className="text-sm opacity-80">Friend Gets</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white p-6 rounded-2xl shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: COLORS.indigo }}>
              Your Referral Code
            </h2>
            <p className="text-gray-500 text-sm">
              Share this code with friends. When they sign up and set their PIN, you both get rewarded instantly!
            </p>
          </div>
          {stats?.referral_code ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div 
                className="flex items-center justify-center px-6 py-3 rounded-xl font-mono text-2xl font-bold tracking-wider"
                style={{ backgroundColor: COLORS.lightGray, color: COLORS.indigo }}
              >
                {stats.referral_code}
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={copyToClipboard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors"
                  style={{ 
                    backgroundColor: copied ? COLORS.mint : COLORS.gold,
                    color: COLORS.indigo 
                  }}
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                  <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
                </motion.button>
                <motion.button
                  onClick={shareReferralCode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold"
                  style={{ backgroundColor: COLORS.indigo, color: COLORS.white }}
                >
                  <FiShare2 />
                  <span className="hidden sm:inline">Share</span>
                </motion.button>
              </div>
            </div>
          ) : (
            <motion.button
              onClick={generateReferralCode}
              disabled={generating}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold"
              style={{ 
                backgroundColor: generating ? COLORS.lightGray : COLORS.gold,
                color: COLORS.indigo 
              }}
            >
              <FiGift />
              {generating ? 'Generating...' : 'Generate Referral Code'}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-lg"
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.indigo }}>
          How It Works - Simple as 1-2-3!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="flex flex-col items-center text-center p-4 rounded-xl transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            style={{ backgroundColor: COLORS.lightGray }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: COLORS.gold }}
            >
              <FiShare2 className="text-2xl" style={{ color: COLORS.white }} />
            </div>
            <div className="text-3xl font-bold mb-2" style={{ color: COLORS.gold }}>1</div>
            <h3 className="font-bold mb-2" style={{ color: COLORS.indigo }}>Share Your Code</h3>
            <p className="text-sm text-gray-500">
              Share your unique referral code with friends via WhatsApp, SMS, or social media.
            </p>
          </motion.div>
          <motion.div 
            className="flex flex-col items-center text-center p-4 rounded-xl transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            style={{ backgroundColor: COLORS.lightGray }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: COLORS.mint }}
            >
              <FiUsers className="text-2xl" style={{ color: COLORS.white }} />
            </div>
            <div className="text-3xl font-bold mb-2" style={{ color: COLORS.mint }}>2</div>
            <h3 className="font-bold mb-2" style={{ color: COLORS.indigo }}>Friend Joins & Sets PIN</h3>
            <p className="text-sm text-gray-500">
              Your friend creates an account using your code and completes setup by creating their transaction PIN.
            </p>
          </motion.div>
          <motion.div 
            className="flex flex-col items-center text-center p-4 rounded-xl transition-all hover:shadow-md"
            whileHover={{ y: -5 }}
            style={{ backgroundColor: COLORS.lightGray }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: COLORS.coral }}
            >
              <FiGift className="text-2xl" style={{ color: COLORS.white }} />
            </div>
            <div className="text-3xl font-bold mb-2" style={{ color: COLORS.coral }}>3</div>
            <h3 className="font-bold mb-2" style={{ color: COLORS.indigo }}>Both Get Paid Instantly!</h3>
            <p className="text-sm text-gray-500">
              You receive <span className="font-bold" style={{ color: COLORS.gold }}>$5</span> and your friend gets <span className="font-bold" style={{ color: COLORS.mint }}>$2</span> credited immediately!
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Earnings Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="p-6 rounded-2xl"
        style={{ backgroundColor: `${COLORS.mint}10`, border: `2px solid ${COLORS.mint}30` }}
      >
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.indigo }}>
            💰 Your Earning Potential
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { friends: 5, amount: 25 },
              { friends: 10, amount: 50 },
              { friends: 20, amount: 100 },
              { friends: 50, amount: 250 },
            ].map((tier) => (
              <div key={tier.friends} className="bg-white p-4 rounded-xl shadow-sm">
                <p className="text-2xl font-bold" style={{ color: COLORS.mint }}>${tier.amount}</p>
                <p className="text-sm text-gray-500">{tier.friends} friends</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            <strong>Unlimited earning potential!</strong> The more friends you refer, the more you earn.
          </p>
        </div>
      </motion.div>

      {/* Referrals List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white p-6 rounded-2xl shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.indigo }}>
          Your Referrals
        </h2>
        
        {referrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.lightGray }}>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Friend</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Your Bonus</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral, index) => {
                  const StatusIcon = getBonusStatusIcon(referral.bonus_status);
                  return (
                    <motion.tr 
                      key={referral.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b hover:bg-gray-50 transition-colors"
                      style={{ borderColor: COLORS.lightGray }}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold" style={{ color: COLORS.darkIndigo }}>
                            {referral.referred_name}
                          </p>
                          <p className="text-sm text-gray-500">{referral.referred_phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-500">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-semibold" style={{ color: COLORS.mint }}>
                        ${referral.referrer_bonus}
                      </td>
                      <td className="py-4 px-4">
                        <span 
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                          style={{ 
                            backgroundColor: `${getBonusStatusColor(referral.bonus_status)}20`,
                            color: getBonusStatusColor(referral.bonus_status)
                          }}
                        >
                          <StatusIcon className="text-sm" />
                          {referral.bonus_status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FiUsers className="mx-auto text-4xl mb-4 opacity-30" style={{ color: COLORS.indigo }} />
            <p className="text-gray-500 mb-2">No referrals yet</p>
            <p className="text-sm text-gray-400">
              Share your referral code to start earning rewards!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

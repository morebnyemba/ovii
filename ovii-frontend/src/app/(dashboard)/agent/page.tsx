'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiDollarSign, FiLock, FiLoader, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useUserStore } from '@/lib/store/useUserStore';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  white: '#FDFDFD',
};

const fetcher = (url: string) => api.get(url).then(res => res.data);

const cashInSchema = z.object({
  customer_phone_number: z.string().min(1, "Customer phone number is required."),
  amount: z.coerce.number().positive("Amount must be positive."),
  pin: z.string().length(4, "Your 4-digit PIN is required."),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof cashInSchema>> | null;

export default function AgentDashboardPage() {
  const { data: profile, error: profileError, isLoading: profileLoading } = useSWR('/agents/profile/', fetcher);
  const { fetchWallet } = useUserStore();

  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCashIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);
    setApiError(null);
    setSuccess(false);

    const validationResult = cashInSchema.safeParse({ customer_phone_number: customerPhone, amount, pin });
    if (!validationResult.success) {
      setFormErrors(validationResult.error.format());
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/agents/cash-in/', validationResult.data);
      toast.success('Cash-in successful!');
      setSuccess(true);
      // Reset form
      setCustomerPhone('');
      setAmount('');
      setPin('');
      // Re-fetch agent's own wallet to reflect the new balance
      fetchWallet();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to process cash-in.';
      setApiError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
          Agent Dashboard
        </h1>
        <p className="mt-1" style={{ color: COLORS.indigo, opacity: 0.8 }}>
          Manage your agent activities and perform customer cash-ins.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Agent Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.indigo }}>Your Agent Profile</h2>
          {profileLoading && <p>Loading profile...</p>}
          {profileError && <p className="text-red-500">Could not load profile.</p>}
          {profile && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Agent Code:</span>
                <span className="font-bold text-lg" style={{ color: COLORS.indigo }}>{profile.agent_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status:</span>
                <span className={`font-bold px-2 py-1 rounded-full text-xs ${profile.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {profile.is_approved ? 'Approved' : 'Pending Approval'}
                </span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Cash-In Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-lg"
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.indigo }}>Perform Cash-In</h2>
          <form onSubmit={handleCashIn} className="space-y-4">
            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Customer's Phone</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} />
                <input id="customerPhone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+263..." required className={`w-full rounded-lg border-2 py-3 pl-10 pr-3 ${formErrors?.customer_phone_number ? 'border-red-500' : 'border-gray-300'}`} />
              </div>
              {formErrors?.customer_phone_number && <p className="mt-1 text-xs text-red-600">{formErrors.customer_phone_number._errors[0]}</p>}
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Amount</label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} />
                <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className={`w-full rounded-lg border-2 py-3 pl-10 pr-3 ${formErrors?.amount ? 'border-red-500' : 'border-gray-300'}`} />
              </div>
              {formErrors?.amount && <p className="mt-1 text-xs text-red-600">{formErrors.amount._errors[0]}</p>}
            </div>
            <div>
              <label htmlFor="pin" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Your PIN</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} />
                <input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" required maxLength={4} className={`w-full rounded-lg border-2 py-3 pl-10 pr-3 ${formErrors?.pin ? 'border-red-500' : 'border-gray-300'}`} />
              </div>
              {formErrors?.pin && <p className="mt-1 text-xs text-red-600">{formErrors.pin._errors[0]}</p>}
            </div>
            {apiError && <div className="flex items-center gap-2 text-sm text-red-600"><FiAlertTriangle /> {apiError}</div>}
            {success && <div className="flex items-center gap-2 text-sm text-green-600"><FiCheckCircle /> Cash-in successful!</div>}
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-full shadow-md transition-all" style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}>
              {isSubmitting ? <FiLoader className="animate-spin" /> : 'Process Cash-In'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
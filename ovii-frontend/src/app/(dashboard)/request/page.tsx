'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiLoader, FiCheckCircle, FiAlertTriangle, FiArrowLeft, FiUser, FiEdit2, FiCopy, FiShare2 } from 'react-icons/fi';
import { useUserStore } from '@/lib/store/useUserStore';
import Link from 'next/link';
import { z } from 'zod';

// Using the same color palette for consistency
const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

// Define the validation schema using Zod
const requestMoneySchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: "Please enter a valid amount." })
    .positive({ message: "Amount must be greater than zero." }),
  note: z.string().max(100, { message: "Note must be 100 characters or less." }).optional(),
});

// Type for our structured form errors
type FormErrors = z.ZodFormattedError<z.infer<typeof requestMoneySchema>> | null;

export default function RequestMoneyPage() {
  const { user } = useUserStore();
  
  // State for form fields
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>(null);
  const [success, setSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const handleRequestMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);

    const validationResult = requestMoneySchema.safeParse({ amount, note });

    if (!validationResult.success) {
      setFormErrors(validationResult.error.format());
      return;
    }

    setIsLoading(true);

    // TODO: Replace with actual API call via Zustand store to generate a unique link
    // Simulating API call
    setTimeout(() => {
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const link = `https://ovii.me/pay/${user?.first_name?.toLowerCase() || 'user'}?amount=${validationResult.data.amount}&note=${encodeURIComponent(validationResult.data.note || '')}&req_id=${uniqueId}`;
      setGeneratedLink(link);
      setSuccess(true);
      setIsLoading(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const resetForm = () => {
    setAmount('');
    setNote('');
    setFormErrors(null);
    setSuccess(false);
    setGeneratedLink('');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: COLORS.indigo }}>
          <FiArrowLeft />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
          Request Money
        </h1>
        <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
          Generate a secure link to get paid.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 bg-white p-6 md:p-8 rounded-2xl shadow-lg"
        style={{ boxShadow: '0 4px 20px rgba(26, 27, 75, 0.1)' }}
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <FiCheckCircle className="mx-auto text-6xl mb-4" style={{ color: COLORS.mint }} />
              <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>Request Link Generated!</h2>
              <p className="mt-2 mb-4" style={{ color: COLORS.darkIndigo }}>Share this link to receive your payment.</p>
              
              <div className="relative">
                <input type="text" readOnly value={generatedLink} className="w-full rounded-lg border-2 bg-lightGray p-3 pr-12 text-sm" style={{ borderColor: COLORS.mint, color: COLORS.darkIndigo }} />
                <button onClick={copyToClipboard} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-200 transition-colors">
                  {isCopied ? <FiCheckCircle style={{ color: COLORS.mint }} /> : <FiCopy style={{ color: COLORS.indigo }} />}
                </button>
              </div>
              {isCopied && <p className="text-xs mt-2" style={{ color: COLORS.mint }}>Copied to clipboard!</p>}

              <button
                onClick={resetForm}
                className="mt-6 font-bold py-3 px-8 rounded-full transition-colors"
                style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
              >
                Create Another Request
              </button>
            </motion.div>
          ) : (
            <motion.form
              noValidate
              key="form"
              onSubmit={handleRequestMoney}
              className="space-y-6"
            >
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Amount</label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} />
                  <input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className={`w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 ${formErrors?.amount ? 'border-red-500' : 'border-mint'}`} style={{ color: COLORS.indigo, backgroundColor: COLORS.white }} />
                </div>
                {formErrors?.amount && <p className="mt-1 text-xs text-red-600">{formErrors.amount._errors[0]}</p>}
              </div>
              <div>
                <label htmlFor="note" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Note for payment (Optional)</label>
                <div className="relative">
                  <FiEdit2 className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} />
                  <input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., For design work" className={`w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 ${formErrors?.note ? 'border-red-500' : 'border-mint'}`} style={{ color: COLORS.indigo, backgroundColor: COLORS.white }} />
                </div>
                {formErrors?.note && <p className="mt-1 text-xs text-red-600">{formErrors.note._errors[0]}</p>}
              </div>

              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-full shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed" style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}>
                {isLoading ? (
                  <><FiLoader className="animate-spin" /><span>Generating Link...</span></>
                ) : (
                  <><FiShare2 /><span>Generate Request Link</span></>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiLoader, FiCheckCircle, FiAlertTriangle, FiArrowLeft, FiUser, FiDollarSign, FiEdit2 } from 'react-icons/fi';
import { useUserStore } from '@/lib/store/useUserStore';
import Link from 'next/link';

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

export default function SendMoneyPage() {
  const { wallet, loading: walletLoading } = useUserStore();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!recipient || !amount || parseFloat(amount) <= 0) {
      setError('Please fill in a valid recipient and amount.');
      return;
    }
    if (wallet && parseFloat(amount) > parseFloat(wallet.balance)) {
      setError('Insufficient balance.');
      return;
    }

    setIsLoading(true);

    // TODO: Replace with actual API call via Zustand store
    // Simulating API call
    setTimeout(() =>{
      try {
        // Simulate a random success or failure
        if (Math.random() > 0.2) { // 80% success chance
          setSuccess(true);
        } else {
          setError('Transaction failed. Please try again.');
        }
      } catch (e : any){
        setError('An unexpected error occurred: ' + e.message);
      } finally {
        setIsLoading(false);
      }
    }, 2000);

  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setNote('');
    setError(null);
    setSuccess(false);
    setIsLoading(false);
  };

  if (walletLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin text-4xl" style={{ color: COLORS.gold }} />
      </div>
    );
  }

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
          Send Money
        </h1>
        <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
          Instantly transfer funds to any Ovii user.
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
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center py-8"
            >
              <FiCheckCircle className="mx-auto text-6xl mb-4" style={{ color: COLORS.mint }} />
              <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>Transfer Successful!</h2>
              <p className="mt-2" style={{ color: COLORS.darkIndigo }}>
                You sent <span className="font-bold">{wallet?.currency} {parseFloat(amount).toFixed(2)}</span> to <span className="font-bold">{recipient}</span>.
              </p>
              <button
                onClick={resetForm}
                className="mt-6 font-bold py-3 px-8 rounded-full transition-colors"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.indigo,
                }}
              >
                Send Another
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSendMoney}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-lg flex justify-between items-center" style={{ backgroundColor: COLORS.lightGray }}>
                <span className="font-medium" style={{ color: COLORS.darkIndigo }}>Your Balance</span>
                <span className="font-bold text-lg" style={{ color: COLORS.indigo }}>
                  {wallet ? `${wallet.currency} ${parseFloat(wallet.balance).toFixed(2)}` : 'Loading...'}
                </span>
              </div>

              {/* Recipient, Amount, and Note Inputs */}
              <div>
                <label htmlFor="recipient" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Recipient's Phone or @OviiTag</label>
                <div className="relative"><FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} /><input id="recipient" type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g., +263712345678 or @moreblessing" required className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.white }} /></div>
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Amount</label>
                <div className="relative"><FiDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} /><input id="amount" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.white }} /></div>
              </div>
              <div>
                <label htmlFor="note" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Note (Optional)</label>
                <div className="relative"><FiEdit2 className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} /><input id="note" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., For lunch" className="w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ borderColor: COLORS.mint, color: COLORS.indigo, backgroundColor: COLORS.white }} /></div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <FiAlertTriangle />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading || !wallet} className="w-full flex items-center justify-center gap-2 font-bold py-4 px-6 rounded-full shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed" style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}>
                {isLoading ? (
                  <><FiLoader className="animate-spin" /><span>Sending...</span></>
                ) : (
                  <><FiSend /><span>Send Now</span></>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
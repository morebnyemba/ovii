'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUserPlus, FiUser, FiPhone, FiLoader, FiCheckCircle, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { z } from 'zod';

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
const beneficiarySchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
});

type FormErrors = z.ZodFormattedError<z.infer<typeof beneficiarySchema>> | null;

interface Beneficiary {
  id: string;
  name: string;
  phone: string;
}

export default function BeneficiariesPage() {
  // State for form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Mock beneficiaries list - In a real app, this would come from an API/store
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);

    const validationResult = beneficiarySchema.safeParse({ name, phone });

    if (!validationResult.success) {
      setFormErrors(validationResult.error.format());
      return;
    }

    setIsLoading(true);

    // TODO: Replace with actual API call to save beneficiary
    setTimeout(() => {
      const newBeneficiary: Beneficiary = {
        id: Math.random().toString(36).substring(2, 10),
        name: validationResult.data.name,
        phone: validationResult.data.phone,
      };
      setBeneficiaries([...beneficiaries, newBeneficiary]);
      setSuccess(true);
      setIsLoading(false);
      
      // Reset form after short delay
      setTimeout(() => {
        setName('');
        setPhone('');
        setSuccess(false);
        setShowForm(false);
      }, 1500);
    }, 1000);
  };

  const handleRemoveBeneficiary = (id: string) => {
    setBeneficiaries(beneficiaries.filter(b => b.id !== id));
  };

  // Phone number formatting for Zimbabwe (+263 followed by 9 digits)
  // Format: +263 7X XXX XXXX (total 12 digits + 3 spaces = 15 chars)
  const handlePhoneChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '');
    // Support up to 12 digits for Zimbabwe numbers (+263 + 9 digits)
    const truncated = cleaned.slice(0, 12);
    const match = truncated.match(/^(\d{0,3})(\d{0,2})(\d{0,3})(\d{0,4})$/);
    if (match) {
      const [, p1, p2, p3, p4] = match;
      const parts = [p1, p2, p3, p4].filter(Boolean);
      const formatted = parts.length ? '+' + parts.join(' ') : '';
      setPhone(formatted);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/dashboard" className="flex items-center gap-2 mb-4 text-sm font-semibold" style={{ color: COLORS.indigo }}>
          <FiArrowLeft />
          Back to Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
              Beneficiaries
            </h1>
            <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
              Manage your saved contacts for quick transfers.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 font-bold py-2 px-4 rounded-full shadow-md"
              style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
            >
              <FiUserPlus />
              Add New
            </button>
          )}
        </div>
      </motion.div>

      {/* Add Beneficiary Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 bg-white p-6 md:p-8 rounded-2xl shadow-lg overflow-hidden"
            style={{ boxShadow: '0 4px 20px rgba(26, 27, 75, 0.1)' }}
          >
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <FiCheckCircle className="mx-auto text-4xl mb-2" style={{ color: COLORS.mint }} />
                <p className="font-semibold" style={{ color: COLORS.indigo }}>Beneficiary Added!</p>
              </motion.div>
            ) : (
              <form onSubmit={handleAddBeneficiary} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>
                    Name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., John Doe"
                      required
                      className={`w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 ${formErrors?.name ? 'border-red-500' : 'border-mint'}`}
                      style={{ color: COLORS.indigo, backgroundColor: COLORS.white }}
                    />
                  </div>
                  {formErrors?.name && <p className="mt-1 text-xs text-red-600">{formErrors.name._errors[0]}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" style={{ color: COLORS.indigo, opacity: 0.5 }} />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+263 712 345 678"
                      maxLength={15}
                      required
                      className={`w-full rounded-lg border-2 bg-transparent py-3 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-offset-2 ${formErrors?.phone ? 'border-red-500' : 'border-mint'}`}
                      style={{ color: COLORS.indigo, backgroundColor: COLORS.white }}
                    />
                  </div>
                  {formErrors?.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone._errors[0]}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setName('');
                      setPhone('');
                      setFormErrors(null);
                    }}
                    className="flex-1 font-bold py-3 px-6 rounded-full transition-colors"
                    style={{ backgroundColor: COLORS.lightGray, color: COLORS.indigo }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-full shadow-md transition-all disabled:opacity-70"
                    style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
                  >
                    {isLoading ? (
                      <><FiLoader className="animate-spin" /><span>Saving...</span></>
                    ) : (
                      <><FiUserPlus /><span>Add Beneficiary</span></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beneficiaries List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8"
      >
        {beneficiaries.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl"
            style={{ backgroundColor: COLORS.white }}
          >
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: COLORS.lightGray }}
            >
              <FiUserPlus className="text-3xl" style={{ color: COLORS.indigo, opacity: 0.3 }} />
            </div>
            <p className="text-lg" style={{ color: COLORS.darkIndigo }}>
              No beneficiaries yet
            </p>
            <p className="text-sm mt-2" style={{ color: COLORS.darkIndigo, opacity: 0.7 }}>
              Add your frequently used contacts for quick and easy transfers.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {beneficiaries.map((beneficiary, index) => (
              <motion.div
                key={beneficiary.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full"
                    style={{ backgroundColor: COLORS.mint }}
                  >
                    <FiUser className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: COLORS.darkIndigo }}>
                      {beneficiary.name}
                    </p>
                    <p className="text-sm text-gray-500">{beneficiary.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/send?recipient=${encodeURIComponent(beneficiary.phone)}`}>
                    <button
                      className="px-4 py-2 rounded-full text-sm font-medium"
                      style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
                    >
                      Send
                    </button>
                  </Link>
                  <button
                    onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors"
                    style={{ color: COLORS.coral }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

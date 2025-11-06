'use client';

import { motion } from 'framer-motion';
import { FiClock } from 'react-icons/fi';

export default function PendingApprovalPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-2xl bg-white p-8 shadow-lg"
        >
          <FiClock className="mx-auto h-16 w-16 text-indigo-600 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Application Submitted</h1>
          <p className="text-gray-600">
            Your agent application has been submitted successfully. It is now under review.
            You will be notified once your application has been approved.
          </p>
        </motion.div>
      </div>
    </motion.main>
  );
}

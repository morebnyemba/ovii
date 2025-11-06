'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiTrendingUp, FiUsers, FiAward, FiArrowRight, FiHome } from 'react-icons/fi';
import { COLORS } from '@/lib/theme';

const features = [
  {
    icon: <FiTrendingUp className="h-8 w-8" style={{ color: COLORS.mint }} />,
    title: 'Earn Commissions',
    description: 'Earn a commission on every cash-in and cash-out transaction you process for Ovii users.',
  },
  {
    icon: <FiUsers className="h-8 w-8" style={{ color: COLORS.gold }} />,
    title: 'Be a Community Hub',
    description: 'Become a vital financial service point in your neighborhood, helping people access their digital money.',
  },
  {
    icon: <FiAward className="h-8 w-8" style={{ color: COLORS.indigo }} />,
    title: 'Simple & Supported',
    description: 'Use our simple agent app to manage transactions, with full support and training from the Ovii team.',
  },
];

export default function AgentPage() {
  return (
    <div
      className="min-h-screen w-full p-4 md:p-8 flex flex-col items-center"
      style={{
        background: `linear-gradient(135deg, ${COLORS.lightGray} 0%, ${COLORS.white} 100%)`,
      }}
    >
      <header className="w-full max-w-5xl mx-auto flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>
          Ovii for Agents
        </h1>
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold transition-colors" style={{ color: COLORS.indigo, opacity: 0.8 }}>
          <FiHome />
          Back to Home
        </Link>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center max-w-5xl mx-auto">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="py-16 md:py-24"
        >
          <h2
            className="text-4xl md:text-6xl font-extrabold tracking-tight"
            style={{ color: COLORS.indigo }}
          >
            Empower Your Community. <br />
            <span style={{ color: COLORS.mint }}>Earn With Ovii.</span>
          </h2>
          <p
            className="mt-6 max-w-2xl mx-auto text-lg md:text-xl"
            style={{ color: COLORS.darkIndigo, opacity: 0.8 }}
          >
            Join our network of trusted agents and provide essential financial services to your community while growing your income.
          </p>
          <Link href="/become-an-agent/apply">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10 inline-flex items-center gap-3 font-bold py-4 px-8 rounded-full text-lg shadow-lg transition-shadow"
              style={{
                backgroundColor: COLORS.gold,
                color: COLORS.indigo,
                boxShadow: `0 10px 20px -5px ${COLORS.gold}40`,
              }}
            >
              Become an Agent <FiArrowRight />
            </motion.button>
          </Link>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full py-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-8 rounded-2xl bg-white text-left"
                style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)' }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.indigo }}>
                  {feature.title}
                </h3>
                <p className="text-base" style={{ color: COLORS.darkIndigo, opacity: 0.7 }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
}
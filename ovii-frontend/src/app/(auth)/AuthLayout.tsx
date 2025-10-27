'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  white: '#FDFDFD',
  darkIndigo: '#0F0F2D',
};

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

interface AuthLayoutProps {
  children: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
  icon: ReactNode;
  footer: ReactNode;
  shake: boolean;
  isMounted: boolean;
  particles: Particle[];
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  icon,
  footer,
  shake,
  isMounted,
  particles,
}: AuthLayoutProps) {
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
              ease: 'easeInOut',
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
                  {icon}
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
              {title}
            </motion.h1>

            <motion.p
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg opacity-80"
              style={{ color: COLORS.indigo }}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* Main Form Area - This is where the specific page content will go */}
          {children}

          {/* Footer Section */}
          {footer}
        </motion.div>
      </motion.div>
    </motion.main>
  );
}
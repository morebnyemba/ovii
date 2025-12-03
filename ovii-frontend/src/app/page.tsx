'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPhone, 
  FiZap, 
  FiShield, 
  FiLock, 
  FiTrendingUp, 
  FiSmartphone,
  FiMail,
  FiArrowRight,
  FiCheck,
  FiPlay,
  FiStar,
  FiUsers,
  FiAward,
  FiMenu,
  FiX
} from 'react-icons/fi';
import Link from 'next/link';

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

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsVisible(true);
    
    // Auto rotate testimonials
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Security', href: '#security' },
    { name: 'Become an Agent', href: '/become-an-agent' },
    { name: 'Become a Merchant', href: '/become-a-merchant' },
  ];


  const features = [
    {
      icon: <FiZap className="text-2xl" />,
      title: "Instant Transfers",
      description: "Send and receive money instantly with zero delays"
    },
    {
      icon: <FiShield className="text-2xl" />,
      title: "Bank-Grade Security",
      description: "Your funds are protected with military-grade encryption"
    },
    {
      icon: <FiTrendingUp className="text-2xl" />,
      title: "Smart Savings",
      description: "Automated savings and investment opportunities"
    },
    {
      icon: <FiSmartphone className="text-2xl" />,
      title: "Mobile First",
      description: "Complete banking experience right from your phone"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up",
      description: "Create your account in under 2 minutes"
    },
    {
      number: "02",
      title: "Verify",
      description: "Secure verification with OTP"
    },
    {
      number: "03",
      title: "Start Banking",
      description: "Access all features immediately"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Small Business Owner",
      content: "Ovii revolutionized how I manage my business finances. Instant payments saved me hours every week!",
      rating: 5
    },
    {
      name: "David Moyo",
      role: "Freelancer",
      content: "The security features give me peace of mind. Finally, a digital wallet I can trust completely.",
      rating: 5
    },
    {
      name: "Amara Singh",
      role: "Student",
      content: "So easy to use! I love the clean design and how quickly I can send money to friends.",
      rating: 4
    }
  ];

  const stats = [
    { number: "50K+", label: "Active Users" },
    { number: "$10M+", label: "Transactions" },
    { number: "99.9%", label: "Uptime" },
    { number: "4.8", label: "App Rating" }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed w-full z-50 backdrop-blur-xl border-b border-white/10"
        style={{ backgroundColor: 'rgba(253, 253, 253, 0.95)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: COLORS.indigo }}
              >
                <FiZap className="text-white" />
              </div>
              <span 
                className="text-xl font-bold"
                style={{ color: COLORS.indigo }}
              >
                Ovii
              </span>
            </motion.div>

            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => ( // Changed from allNavLinks to navItems
                <a
                  key={item.name}
                  href={item.href}
                  className="font-medium transition-colors hover:text-blue-600"
                  style={{ color: COLORS.indigo }}
                >
                  {item.name}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/login')}
                className="hidden sm:block px-5 py-2 rounded-xl font-semibold transition-all border-2"
                style={{
                  borderColor: COLORS.indigo,
                  color: COLORS.indigo,
                  backgroundColor: 'transparent',
                }}
              >
                Login
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/register')}
                className="hidden sm:block px-5 py-2 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.indigo,
                }}
              >
                Register
              </motion.button>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ color: COLORS.indigo }}>
                  {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 w-full z-40 md:hidden p-4"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium text-lg p-2 rounded-md transition-colors hover:bg-gray-100"
                    style={{ color: COLORS.indigo }}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="border-t pt-4 mt-2 space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push('/login');
                    }}
                    className="w-full px-6 py-3 rounded-xl font-semibold transition-all border-2"
                    style={{
                      borderColor: COLORS.indigo,
                      color: COLORS.indigo,
                    }}
                  >
                    Login
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push('/register');
                    }}
                    className="w-full px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                    style={{
                      backgroundColor: COLORS.gold,
                      color: COLORS.indigo,
                    }}
                  >
                    Register
                  </motion.button>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center pt-20 pb-32 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${COLORS.darkIndigo} 0%, ${COLORS.indigo} 50%, ${COLORS.mint} 100%)`,
        }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 20 - 10, 0],
                opacity: [0, 0.3, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6"
              style={{ color: COLORS.white }}
            >
              Banking
              <motion.span
                className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Reimagined
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto"
              style={{ color: COLORS.white }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Experience the future of digital payments with Ovii. Secure, instant, and effortless 
              money management in the palm of your hand.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/register')}
                className="px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.indigo,
                }}
              >
                Get Started Free
                <FiArrowRight className="inline ml-2" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/login')}
                className="px-8 py-4 rounded-2xl font-bold text-lg border-2 backdrop-blur-sm transition-all"
                style={{
                  borderColor: COLORS.mint,
                  color: COLORS.white,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                Already have an account? Login
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="text-2xl md:text-3xl font-bold mb-1"
                    style={{ color: COLORS.gold }}
                  >
                    {stat.number}
                  </div>
                  <div 
                    className="text-sm opacity-80"
                    style={{ color: COLORS.white }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div 
            className="w-6 h-10 border-2 rounded-full flex justify-center"
            style={{ borderColor: COLORS.mint }}
          >
            <motion.div
              className="w-1 h-3 rounded-full mt-2"
              style={{ backgroundColor: COLORS.mint }}
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: COLORS.indigo }}
            >
              Why Choose Ovii?
            </h2>
            <p 
              className="text-xl max-w-2xl mx-auto opacity-80"
              style={{ color: COLORS.indigo }}
            >
              Built with cutting-edge technology to give you the best digital banking experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl backdrop-blur-sm border border-gray-100 hover:shadow-2xl transition-all group"
              >
                <div 
                  className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${COLORS.mint}20` }}
                >
                  <div style={{ color: COLORS.mint }}>
                    {feature.icon}
                  </div>
                </div>
                <h3 
                  className="text-xl font-semibold mb-2"
                  style={{ color: COLORS.indigo }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="opacity-70"
                  style={{ color: COLORS.indigo }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20" style={{ backgroundColor: COLORS.lightGray }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: COLORS.indigo }}
            >
              Get Started in 3 Steps
            </h2>
            <p 
              className="text-xl max-w-2xl mx-auto opacity-80"
              style={{ color: COLORS.indigo }}
            >
              Simple, secure, and straightforward
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div 
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-bold shadow-lg"
                  style={{
                    backgroundColor: COLORS.indigo,
                    color: COLORS.white,
                  }}
                >
                  {step.number}
                </div>
                <h3 
                  className="text-2xl font-semibold mb-4"
                  style={{ color: COLORS.indigo }}
                >
                  {step.title}
                </h3>
                <p 
                  className="text-lg opacity-80"
                  style={{ color: COLORS.indigo }}
                >
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h2 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: COLORS.indigo }}
            >
              Loved by Thousands
            </h2>
            <p 
              className="text-xl max-w-2xl mx-auto opacity-80"
              style={{ color: COLORS.indigo }}
            >
              Join our community of satisfied users
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={i < testimonials[activeTestimonial].rating ? "text-yellow-400" : "text-gray-300"}
                      fill={i < testimonials[activeTestimonial].rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                <p 
                  className="text-xl italic mb-6"
                  style={{ color: COLORS.indigo }}
                >
                  "{testimonials[activeTestimonial].content}"
                </p>
                <div>
                  <div 
                    className="font-semibold"
                    style={{ color: COLORS.indigo }}
                  >
                    {testimonials[activeTestimonial].name}
                  </div>
                  <div 
                    className="opacity-70"
                    style={{ color: COLORS.indigo }}
                  >
                    {testimonials[activeTestimonial].role}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === activeTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20" style={{ backgroundColor: COLORS.darkIndigo }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              <h2 
                className="text-4xl md:text-5xl font-bold mb-6"
                style={{ color: COLORS.white }}
              >
                Your Security is Our Priority
              </h2>
              <p 
                className="text-xl mb-8 opacity-90"
                style={{ color: COLORS.white }}
              >
                We use bank-level encryption and multi-factor authentication to ensure your money and data are always safe.
              </p>
              
              <div className="space-y-4">
                {[
                  "256-bit SSL Encryption",
                  "Biometric Authentication",
                  "Real-time Fraud Monitoring",
                  "Secure OTP Verification"
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: COLORS.mint }}
                    >
                      <FiCheck className="text-white text-sm" />
                    </div>
                    <span style={{ color: COLORS.white }}>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div 
                className="w-80 h-80 rounded-full mx-auto blur-3xl opacity-20 absolute -inset-0 m-auto"
                style={{ backgroundColor: COLORS.mint }}
              />
              <div 
                className="relative bg-white rounded-3xl p-8 shadow-2xl mx-auto max-w-sm"
                style={{ backgroundColor: 'rgba(253, 253, 253, 0.95)' }}
              >
                <div className="text-center mb-6">
                  <FiLock 
                    className="text-4xl mx-auto mb-4"
                    style={{ color: COLORS.mint }}
                  />
                  <h3 
                    className="text-2xl font-bold"
                    style={{ color: COLORS.indigo }}
                  >
                    Protected & Secure
                  </h3>
                </div>
                <div 
                  className="space-y-3 text-center"
                  style={{ color: COLORS.indigo }}
                >
                  <p>End-to-end encryption</p>
                  <p>Regular security audits</p>
                  <p>Insurance protection</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl p-12 text-white shadow-2xl"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of users who trust Ovii with their financial journey
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/register')}
                className="px-12 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all"
                style={{
                  backgroundColor: COLORS.gold,
                  color: COLORS.indigo,
                }}
              >
                Create Your Account
                <FiArrowRight className="inline ml-2" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/login')}
                className="px-8 py-4 rounded-2xl font-bold text-lg border-2 transition-all"
                style={{
                  borderColor: COLORS.white,
                  color: COLORS.white,
                  backgroundColor: 'transparent',
                }}
              >
                Login
              </motion.button>
            </div>
            <p className="mt-4 text-sm opacity-80">
              No credit card required • Free forever
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: COLORS.darkIndigo }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: COLORS.mint }}
                >
                  <FiZap className="text-white" />
                </div>
                <span 
                  className="text-xl font-bold"
                  style={{ color: COLORS.white }}
                >
                  Ovii
                </span>
              </div>
              <p 
                className="opacity-70"
                style={{ color: COLORS.white }}
              >
                The future of digital banking is here.
              </p>
            </div>
            
            {/* Product Links */}
            <div>
              <h4 
                className="font-semibold mb-4"
                style={{ color: COLORS.white }}
              >
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#features"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a 
                    href="#security"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a 
                    href="#how-it-works"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    How It Works
                  </a>
                </li>
              </ul>
            </div>

            {/* Get Started Links */}
            <div>
              <h4 
                className="font-semibold mb-4"
                style={{ color: COLORS.white }}
              >
                Get Started
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/register"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/login"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/become-an-agent"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Become an Agent
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/become-a-merchant"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Become a Merchant
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 
                className="font-semibold mb-4"
                style={{ color: COLORS.white }}
              >
                Support
              </h4>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="#"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a 
                    href="#"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a 
                    href="#"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="#"
                    className="opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.white }}
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div 
            className="border-t mt-8 pt-8 text-center opacity-70"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: COLORS.white }}
          >
            <p>&copy; 2025 Ovii. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
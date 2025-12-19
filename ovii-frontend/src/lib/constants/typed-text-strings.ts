/**
 * Typed text strings used across the application
 * Centralized for easy maintenance and future localization
 */

export const TYPED_STRINGS = {
  landing: {
    hero: {
      taglines: [
        'differently here.',
        'at the speed of trust.',
        'without borders.',
        'the way you need it.',
      ],
      subtitles: [
        "For creators, hustlers, and builders who don't wait.",
        'Send, receive, and build wealth without borders.',
        'Your secure digital wallet for instant payments.',
        'Join thousands moving money the smart way.',
      ],
    },
    whyOvii: [
      '"For those who move different."',
      '"Banking that moves at your speed."',
      '"Your money, your way, instantly."',
      '"Built for the future of finance."',
    ],
  },
  login: {
    welcome: [
      'Your secure digital wallet',
      'Login to access your funds',
      'Fast and secure authentication',
      'Welcome back!',
    ],
  },
  register: {
    onboarding: [
      'Create your account for instant payments',
      'Join thousands of users worldwide',
      'Get started in just a few steps',
      'Your journey to financial freedom starts here',
    ],
  },
  dashboard: {
    welcome: [
      "Here's a snapshot of your finances.",
      'Your wallet is ready for action.',
      'Make your next move count.',
      'Manage your money with ease.',
    ],
  },
} as const;

// Min height constants to prevent layout shift
export const TYPED_TEXT_MIN_HEIGHTS = {
  hero: '4rem',
  subtitle: '1.75rem',
  standard: '1.5rem',
} as const;

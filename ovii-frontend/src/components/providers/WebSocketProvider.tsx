'use client';

import { useWalletSocket } from '@/hooks/useWalletSocket';

// This provider component doesn't render any UI. Its sole purpose is to
// activate the useWalletSocket hook for its children, establishing the
// real-time connection for the authenticated user.
export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  useWalletSocket();
  return <>{children}</>;
};
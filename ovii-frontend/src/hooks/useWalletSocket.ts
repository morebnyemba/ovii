'use client';

import { useEffect, useRef } from 'react';
import { useUserStore } from '@/lib/store/useUserStore';
import toast from 'react-hot-toast';

// This hook manages the WebSocket connection for real-time wallet updates.
export const useWalletSocket = () => {
  const socket = useRef<WebSocket | null>(null);
  const { user, fetchWallet, fetchTransactions } = useUserStore();

  useEffect(() => {
    // Only establish connection if we have a user token and no active socket.
    if (user?.access_token && !socket.current) {
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://127.0.0.1:8000/ws/wallet/';
      const fullUrl = `${wsUrl}?token=${user.access_token}`;

      console.log('Ovii: Connecting to real-time service...');
      socket.current = new WebSocket(fullUrl);

      socket.current.onopen = () => {
        console.log('Ovii: Real-time connection established.');
      };

      socket.current.onmessage = (event) => {
        try {
          const parsedEvent = JSON.parse(event.data);
          console.log('Ovii: Real-time update received:', parsedEvent);

          if (parsedEvent?.data?.message) {
            // Show a success toast with the message from the backend signal.
            toast.success(parsedEvent.data.message);

            // When a wallet update message arrives, refetch data to update the UI.
            // This is triggered by the `broadcast_transaction_update` signal in Django.
            fetchWallet();
            fetchTransactions();
          }
        } catch (error) {
          console.error('Ovii: Error processing real-time update.', error);
        }
      };

      socket.current.onclose = () => {
        console.log('Ovii: Real-time connection closed.');
        socket.current = null; // Ensure we can reconnect on next render
      };

      socket.current.onerror = (error) => {
        console.error('Ovii: Real-time connection error.', error);
        socket.current?.close();
      };
    }

    // Cleanup on component unmount or when the user logs out.
    return () => {
      if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.close();
      }
    };
  }, [user, fetchWallet, fetchTransactions]);
};
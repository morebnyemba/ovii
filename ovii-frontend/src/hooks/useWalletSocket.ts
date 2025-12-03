'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '@/lib/store/useUserStore';
import toast from 'react-hot-toast';

// This hook manages the WebSocket connection for real-time wallet updates.
export const useWalletSocket = () => {
  const socket = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const isConnecting = useRef(false);
  const maxReconnectAttempts = 5;
  const { accessToken, fetchWallet, fetchTransactions } = useUserStore();

  const connect = useCallback(() => {
    // Only establish connection if we have a user token and no active/connecting socket.
    if (!accessToken || isConnecting.current) {
      return;
    }

    // Check if socket exists and is in a usable state
    if (socket.current) {
      const state = socket.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
      // Close any existing socket in CLOSING state before creating new one
      if (state === WebSocket.CLOSING) {
        socket.current.close();
      }
    }

    isConnecting.current = true;
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://api.ovii.it.com/ws/wallet/';
    const fullUrl = `${wsUrl}?token=${accessToken}`;

    console.log('Ovii: Connecting to real-time service...');
    socket.current = new WebSocket(fullUrl);

    socket.current.onopen = () => {
      console.log('Ovii: Real-time connection established.');
      isConnecting.current = false;
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
    };

    socket.current.onmessage = (event) => {
      try {
        const parsedEvent = JSON.parse(event.data);
        console.log('Ovii: Real-time update received:', parsedEvent);

        if (parsedEvent?.data?.message) {
          // Show a success toast with the message from the backend signal.
          toast.success(parsedEvent.data.message, {
            duration: 5000,
            icon: '🔔',
          });

          // When a wallet update message arrives, refetch data to update the UI.
          // This is triggered by the `broadcast_transaction_update` signal in Django.
          fetchWallet();
          fetchTransactions();
        }

        // Handle notification-specific messages
        if (parsedEvent?.type === 'notification') {
          toast(parsedEvent.data?.title || 'New notification', {
            duration: 4000,
            icon: '📬',
          });
        }
      } catch (error) {
        console.error('Ovii: Error processing real-time update.', error);
      }
    };

    socket.current.onclose = (event) => {
      console.log('Ovii: Real-time connection closed.', event.code, event.reason);
      isConnecting.current = false;
      socket.current = null;

      // Clear any existing reconnect timeout before scheduling a new one
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }

      // Attempt to reconnect if not a clean close and we haven't exceeded max attempts
      if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts && accessToken) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Ovii: Attempting to reconnect in ${delay}ms...`);
        
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    socket.current.onerror = (error) => {
      console.error('Ovii: Real-time connection error.', error);
      isConnecting.current = false;
    };
  }, [accessToken, fetchWallet, fetchTransactions]);

  useEffect(() => {
    connect();

    // Cleanup on component unmount or when the user logs out.
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (socket.current) {
        if (socket.current.readyState === WebSocket.OPEN || 
            socket.current.readyState === WebSocket.CONNECTING) {
          socket.current.close(1000, 'Component unmounting');
        }
        socket.current = null;
      }
      isConnecting.current = false;
    };
  }, [connect]);
};
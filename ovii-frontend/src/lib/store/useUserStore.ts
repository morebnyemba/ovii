import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from './api'; // Correct the import path if necessary

// --- Enums to Match Your Django Model Choices ---
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export enum VerificationLevels {
  LEVEL_0 = 0,
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// --- Interfaces Matching Your Backend Serializers ---
export interface User {
  id: number;
  email: string | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_picture: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postal_code: string;
  country: string;
  date_joined: string;
  last_login: string | null;
  is_active: boolean;
  has_set_pin: boolean;
  verification_level: VerificationLevels;
}

export interface Wallet {
  user: string;
  balance: string;
  currency: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  sender: string;
  receiver: string | null;
  amount: string;
  status: TransactionStatus;
  transaction_type: string;
  description: string;
  timestamp: string;
}

// --- The Main Zustand Store State Definition ---
interface UserState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  wallet: Wallet | null;
  transactions: Transaction[];
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  loading: {
    wallet: boolean;
    transactions: boolean;
    sendMoney: boolean;
  };
  error: {
    wallet: string | null;
    transactions: string | null;
    sendMoney: string | null;
  };
  login: (userData: User, access: string, refresh: string) => Promise<void>;
  logout: () => void;
  fetchWallet: () => Promise<void>;
  fetchUser: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  sendMoney: (recipient: string, amount: number, pin: string, note?: string) => Promise<boolean>;
  setHasHydrated: (state: boolean) => void;
}

// --- The Zustand Store Implementation ---
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      wallet: null,
      transactions: [],
      isAuthenticated: false,
      _hasHydrated: false,
      loading: { wallet: false, transactions: false, sendMoney: false },
      error: { wallet: null, transactions: null, sendMoney: null },

      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },

      login: async (userData, access, refresh) => {
        set({
          user: userData,
          isAuthenticated: true,
          accessToken: access,
          refreshToken: refresh,
          error: { wallet: null, transactions: null, sendMoney: null },
        });
        // Set cookies for the API interceptor and server-side contexts
        Cookies.set('access_token', access, { expires: 1, secure: process.env.NODE_ENV === 'production' });
        Cookies.set('refresh_token', refresh, { expires: 7, secure: process.env.NODE_ENV === 'production' });
        // Now that state and cookies are set, fetch user-specific data
        await get().fetchUser();
        await get().fetchWallet();
        await get().fetchTransactions();
      },

      logout: () => {
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          wallet: null,
          transactions: [],
          isAuthenticated: false,
          error: { wallet: null, transactions: null, sendMoney: null },
        });
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
      },

      fetchUser: async () => {
        if (!get().isAuthenticated) return;
        try {
          const response = await api.get('/users/me/');
          set({ user: response.data });
          console.log('User profile refreshed.');
        } catch (err) {
          console.error('Failed to refresh user profile:', err);
          // If fetching the user fails, it might mean the token is invalid, so we log them out.
          get().logout();
        }
      },

      fetchWallet: async () => {
        if (!get().isAuthenticated) return;
        set((state) => ({
          loading: { ...state.loading, wallet: true },
          error: { ...state.error, wallet: null },
        }));
        try {
          const response = await api.get('/wallets/me/');
          set({ wallet: response.data });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Could not fetch wallet details.';
          set((state) => ({
            error: { ...state.error, wallet: errorMessage },
          }));
          console.error('Fetch Wallet Error:', err);
        } finally {
          set((state) => ({ loading: { ...state.loading, wallet: false } }));
        }
      },

      fetchTransactions: async (page = 1) => {
        if (!get().isAuthenticated) return;
        set((state) => ({
          loading: { ...state.loading, transactions: true },
          error: { ...state.error, transactions: null },
        }));
        try {
          // Assuming your backend supports pagination via query params
          const response = await api.get(`/wallets/transactions/?page=${page}`);
          set({ transactions: response.data });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Could not fetch transaction history.';
          set((state) => ({
            error: { ...state.error, transactions: errorMessage },
          }));
          console.error('Fetch Transactions Error:', err);
        } finally {
          set((state) => ({
            loading: { ...state.loading, transactions: false },
          }));
        }
      },

      sendMoney: async (recipient: string, amount: number, pin: string, note?: string) => {
        set((state) => ({
          loading: { ...state.loading, sendMoney: true },
          error: { ...state.error, sendMoney: null },
        }));
        try {
          // Correct endpoint is /wallets/transfer/ and it requires a PIN
          const response = await api.post('/wallets/transfer/', {
            destination_phone_number: recipient,
            amount,
            pin,
            description: note,
          });

          // Successful creation returns 201
          if (response.status === 201) {
            // Refresh wallet and transactions after successful send
            await get().fetchWallet();
            await get().fetchTransactions();
            return true; // Indicate success
          }
          // The backend should ideally return a non-200 status for failures
          set((state) => ({
            error: { ...state.error, sendMoney: 'Failed to send money.' },
          }));
          return false; // Indicate failure
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || error.message || 'An unexpected error occurred. Please try again.';
          console.error('Send Money Error:', error);
          set((state) => ({
            error: { ...state.error, sendMoney: errorMessage },
          }));
          return false; // Indicate failure
        } finally {
          set((state) => ({
            loading: { ...state.loading, sendMoney: false },
          }));
        }
      },
    }),
    {
      name: 'ovii-user-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
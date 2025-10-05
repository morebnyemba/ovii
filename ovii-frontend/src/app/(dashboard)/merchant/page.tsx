'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCopy, FiRefreshCw, FiSave, FiAlertTriangle, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import useSWR, { useSWRConfig } from 'swr';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  white: '#FDFDFD',
  coral: '#FF6B6B',
};

const fetcher = (url: string) => api.get(url).then(res => res.data);

export default function MerchantDashboardPage() {
  const { data: profile, error, isLoading } = useSWR('/merchants/profile/', fetcher);
  const { mutate } = useSWRConfig();

  const [webhookUrl, setWebhookUrl] = useState(profile?.webhook_url || '');
  const [returnUrl, setReturnUrl] = useState(profile?.return_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Set local state from SWR data when it loads
  useState(() => {
    if (profile) {
      setWebhookUrl(profile.webhook_url || '');
      setReturnUrl(profile.return_url || '');
    }
  }, [profile]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await api.patch('/merchants/profile/', {
        webhook_url: webhookUrl,
        return_url: returnUrl,
      });
      mutate('/merchants/profile/');
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate your API key? Your old key will stop working immediately.')) {
      return;
    }
    setIsRegenerating(true);
    try {
      await api.post('/merchants/profile/regenerate-key/');
      mutate('/merchants/profile/');
      toast.success('API Key regenerated! Please update your integration.');
    } catch (err) {
      toast.error('Failed to regenerate API key.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('API Key copied to clipboard!');
  };

  if (isLoading) return <div className="text-center p-10"><FiLoader className="animate-spin mx-auto text-4xl" style={{ color: COLORS.gold }} /></div>;
  if (error) return <div className="text-center p-10 text-red-500"><FiAlertTriangle className="mx-auto text-4xl mb-2" />Could not load merchant profile.</div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
          Merchant Dashboard
        </h1>
        <p className="mt-1" style={{ color: COLORS.indigo, opacity: 0.8 }}>
          Manage your business integration and API settings.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-lg"
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.indigo }}>API Credentials</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Your API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                readOnly
                value={profile.api_key}
                className="w-full rounded-lg border-2 bg-gray-100 py-3 pl-4 pr-24"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button onClick={() => setShowApiKey(!showApiKey)} className="text-gray-500 hover:text-gray-700">
                  {showApiKey ? <FiEyeOff /> : <FiEye />}
                </button>
                <button onClick={() => copyToClipboard(profile.api_key)} className="ml-2 text-gray-500 hover:text-gray-700">
                  <FiCopy />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleRegenerateKey}
            disabled={isRegenerating}
            className="flex items-center gap-2 text-sm font-semibold py-2 px-4 rounded-full transition-colors"
            style={{ backgroundColor: COLORS.coral, color: COLORS.white }}
          >
            {isRegenerating ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
            Regenerate Key
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 md:p-8 rounded-2xl shadow-lg"
      >
        <h2 className="text-xl font-bold mb-6" style={{ color: COLORS.indigo }}>Integration Settings</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="webhookUrl" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Webhook URL</label>
            <input id="webhookUrl" type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-site.com/api/payments" className="w-full rounded-lg border-2 py-3 px-4" style={{ borderColor: COLORS.mint }} />
            <p className="text-xs text-gray-500 mt-1">We'll send a POST request here with payment status updates.</p>
          </div>
          <div>
            <label htmlFor="returnUrl" className="block text-sm font-medium mb-1" style={{ color: COLORS.indigo }}>Return URL</label>
            <input id="returnUrl" type="url" value={returnUrl} onChange={(e) => setReturnUrl(e.target.value)} placeholder="https://your-site.com/payment-success" className="w-full rounded-lg border-2 py-3 px-4" style={{ borderColor: COLORS.mint }} />
            <p className="text-xs text-gray-500 mt-1">Customers will be redirected here after completing a payment.</p>
          </div>
          <div className="pt-4">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-2 font-bold py-3 px-6 rounded-full transition-colors"
              style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
            >
              {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />}
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store/useUserStore';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiShield, FiEdit, FiSave, FiX, FiBriefcase, FiAward, FiPercent } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

const ProfileSkeleton = () => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <Skeleton width={250} height={40} />
      <Skeleton width={100} height={40} borderRadius={999} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 p-6 rounded-2xl shadow-lg bg-white">
        <div className="flex flex-col items-center">
          <Skeleton circle width={96} height={96} />
          <Skeleton width={150} height={28} className="mt-4" />
          <Skeleton width={120} height={20} className="mt-2" />
        </div>
      </div>
      <div className="md:col-span-2 p-6 rounded-2xl shadow-lg bg-white space-y-6">
        <div>
          <Skeleton width={150} height={24} />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </div>
        <div>
          <Skeleton width={150} height={24} />
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ProfileField = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number | undefined | null }) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: COLORS.lightGray }}>
      <Icon className="text-lg" style={{ color: COLORS.indigo }} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold" style={{ color: COLORS.darkIndigo }}>{value || 'Not set'}</p>
    </div>
  </div>
);

const EditProfileField = ({ label, name, value, onChange, type = 'text' }: { label: string, name: string, value: string | undefined, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      value={value || ''}
      onChange={onChange}
      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
      style={{ backgroundColor: COLORS.lightGray, color: COLORS.darkIndigo }}
      autoComplete="off"
    />
  </div>
);

export default function AgentProfilePage() {
  const { user, loading, _hasHydrated, updateUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user?.agent_profile);

  useEffect(() => {
    if (!isEditing) {
      setFormData(user?.agent_profile);
    }
  }, [user, isEditing]);

  if (!_hasHydrated || loading.wallet) {
    return <ProfileSkeleton />;
  }

  if (!user || user.role !== 'AGENT' || !user.agent_profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p>You must be an agent to view this page.</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (formData) {
      try {
        await api.patch('/agents/profile/', formData);
        toast.success('Profile updated successfully!');
        // Refresh user data to update the store
        await useUserStore.getState().fetchUser();
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || 'Failed to update profile. Please try again.';
        toast.error(errorMessage);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user.agent_profile); // Revert changes
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
            {isEditing ? 'Edit Agent Profile' : 'Agent Profile'}
          </h1>
          <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
            {isEditing ? 'Update your business information below.' : 'Manage your agent and business details.'}
          </p>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCancel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 font-bold py-2 px-5 rounded-full shadow-md bg-gray-200"
              style={{ color: COLORS.darkIndigo }}
            >
              <FiX />
              <span>Cancel</span>
            </motion.button>
            <motion.button
              onClick={handleSave}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 font-bold py-2 px-5 rounded-full shadow-md"
              style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
            >
              <FiSave />
              <span>Save Changes</span>
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={() => setIsEditing(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 font-bold py-2 px-5 rounded-full shadow-md"
            style={{ backgroundColor: COLORS.gold, color: COLORS.indigo }}
          >
            <FiEdit />
            <span>Edit Profile</span>
          </motion.button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Picture and Name */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.mint }}>
            <FiUser className="text-white" size={48} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>
            {user.agent_profile?.business_name}
          </h2>
          <p className="text-gray-500">Agent Code: {user.agent_profile?.agent_code}</p>
          <div className="mt-4 text-sm font-semibold py-1 px-3 rounded-full" style={{ backgroundColor: COLORS.lightGray, color: COLORS.indigo }}>
            Tier: {user.agent_profile?.tier}
          </div>
          <div className="mt-2 text-sm font-semibold py-1 px-3 rounded-full" style={{ backgroundColor: COLORS.lightGray, color: COLORS.indigo }}>
            Commission Rate: {user.agent_profile?.commission_rate}%
          </div>
        </motion.div>

        {/* Right Column: Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
            {isEditing ? (
              <>
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: COLORS.indigo }}>Business Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                    <EditProfileField label="Business Name" name="business_name" value={formData?.business_name} onChange={handleInputChange} />
                    <EditProfileField label="Location" name="location" value={formData?.location} onChange={handleInputChange} />
                    <EditProfileField label="Business Address" name="business_address" value={formData?.business_address} onChange={handleInputChange} />
                    <EditProfileField label="Business Registration Number" name="business_registration_number" value={formData?.business_registration_number} onChange={handleInputChange} />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: COLORS.indigo }}>Business Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ProfileField icon={FiBriefcase} label="Business Name" value={user.agent_profile?.business_name} />
                  <ProfileField icon={FiMapPin} label="Location" value={user.agent_profile?.location} />
                  <ProfileField icon={FiMapPin} label="Business Address" value={user.agent_profile?.business_address} />
                  <ProfileField icon={FiAward} label="Business Reg. No." value={user.agent_profile?.business_registration_number} />
                </div>
              </div>
            )}

            {/* Agent Status */}
            <div>
              <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: COLORS.indigo }}>Agent Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                <ProfileField icon={FiShield} label="Approval Status" value={user.agent_profile?.is_approved ? 'Approved' : 'Pending'} />
                <ProfileField icon={FiCalendar} label="Member Since" value={user.agent_profile?.created_at ? new Date(user.agent_profile.created_at).toLocaleDateString() : 'N/A'} />
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

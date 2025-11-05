import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store/useUserStore';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, FiShield, FiEdit, FiSave, FiX } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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

export default function ProfilePage() {
  const { user, loading, _hasHydrated, updateUser } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);

  useEffect(() => {
    if (!isEditing) {
      setFormData(user);
    }
  }, [user, isEditing]);

  if (!_hasHydrated || loading.wallet) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (formData) {
      await updateUser(formData);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(user); // Revert changes
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
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>
          <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
            {isEditing ? 'Update your personal information below.' : 'Manage your personal and account details.'}
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
            {formData?.first_name} {formData?.last_name}
          </h2>
          <p className="text-gray-500">{user.email}</p>
          <div className="mt-4 text-sm font-semibold py-1 px-3 rounded-full" style={{ backgroundColor: COLORS.lightGray, color: COLORS.indigo }}>
            Verification Level: {user.verification_level}
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
                  <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: COLORS.indigo }}>Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                    <EditProfileField label="First Name" name="first_name" value={formData?.first_name} onChange={handleInputChange} />
                    <EditProfileField label="Last Name" name="last_name" value={formData?.last_name} onChange={handleInputChange} />
                    <ProfileField icon={FiMail} label="Email Address" value={user.email} />
                    <EditProfileField label="Phone Number" name="phone_number" value={formData?.phone_number} onChange={handleInputChange} />
                    <EditProfileField label="Date of Birth" name="date_of_birth" value={formData?.date_of_birth ? new Date(formData.date_of_birth).toISOString().split('T')[0] : ''} onChange={handleInputChange} type="date" />
                    <EditProfileField label="Gender" name="gender" value={formData?.gender} onChange={handleInputChange} />
                    <div className="sm:col-span-2">
                      <EditProfileField label="Address" name="address_line_1" value={formData?.address_line_1} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: COLORS.indigo }}>Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <ProfileField icon={FiUser} label="Full Name" value={`${user.first_name} ${user.last_name}`} />
                  <ProfileField icon={FiMail} label="Email Address" value={user.email} />
                  <ProfileField icon={FiPhone} label="Phone Number" value={user.phone_number} />
                  <ProfileField icon={FiCalendar} label="Date of Birth" value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not set'} />
                  <ProfileField icon={FiUser} label="Gender" value={user.gender} />
                  <ProfileField icon={FiMapPin} label="Address" value={user.address_line_1} />
                </div>
              </div>
            )}

            {/* Account Details */}
            <div>
              <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: COLORS.indigo }}>Account Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                <ProfileField icon={FiShield} label="Account Status" value={user.is_active ? 'Active' : 'Inactive'} />
                <ProfileField icon={FiCalendar} label="Member Since" value={new Date(user.date_joined).toLocaleDateString()} />
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
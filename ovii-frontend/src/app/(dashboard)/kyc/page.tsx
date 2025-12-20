"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUserStore, VerificationLevels } from '@/lib/store/useUserStore';
import { motion } from 'framer-motion';
import { 
  FiShield, 
  FiCheck, 
  FiUpload, 
  FiAlertCircle, 
  FiLock,
  FiPhone,
  FiFileText,
  FiMapPin,
  FiChevronRight,
  FiLoader,
  FiCheckCircle,
  FiClock,
  FiX
} from 'react-icons/fi';
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

interface KYCDocument {
  id: number;
  document_type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploaded_at: string;
}

interface KYCLevel {
  level: number;
  name: string;
  description: string;
  requirements: string[];
  benefits: string[];
  icon: React.ElementType;
  documentType?: string;
  color: string;
}

const KYC_LEVELS: KYCLevel[] = [
  {
    level: 0,
    name: 'Unverified',
    description: 'Basic access with limited features',
    requirements: ['Create an account'],
    benefits: ['View wallet balance', 'Receive money up to $50/day', 'Explore the platform'],
    icon: FiLock,
    color: COLORS.coral,
  },
  {
    level: 1,
    name: 'Mobile Verified',
    description: 'Phone number verified via OTP - Takes 2 minutes',
    requirements: ['Verify phone number via OTP'],
    benefits: ['Send & receive money freely', 'Daily limit: $500', 'Access to payment features', 'Request money from others', 'Pay merchants'],
    icon: FiPhone,
    color: COLORS.gold,
  },
  {
    level: 2,
    name: 'Identity Verified',
    description: 'Government-issued ID verified - Reviewed within 24 hours',
    requirements: ['Upload valid National ID or Passport', 'Clear photo showing all details', 'Typically verified in 24 hours'],
    benefits: ['Higher transaction limits', 'Daily limit: $2,000', 'Monthly limit: $50,000', 'Business transactions enabled', 'Lower fees on large transfers'],
    icon: FiFileText,
    documentType: 'ID_CARD',
    color: COLORS.mint,
  },
  {
    level: 3,
    name: 'Address Verified',
    description: 'Full verification - Premium features unlocked',
    requirements: ['Upload utility bill or bank statement', 'Document dated within last 3 months', 'Address must match ID'],
    benefits: ['Maximum transaction limits', 'Daily limit: $10,000', 'Monthly limit: Unlimited', 'Priority customer support', 'Full platform access', 'Exclusive features'],
    icon: FiMapPin,
    documentType: 'UTILITY_BILL',
    color: COLORS.indigo,
  },
];

const KYCSkeleton = () => (
  <div className="space-y-8">
    <div>
      <Skeleton width={250} height={40} />
      <Skeleton width={350} height={20} className="mt-2" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 rounded-2xl shadow-lg bg-white">
          <Skeleton circle width={48} height={48} />
          <Skeleton width={120} height={24} className="mt-4" />
          <Skeleton width={180} height={16} className="mt-2" />
        </div>
      ))}
    </div>
  </div>
);

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return FiCheckCircle;
    case 'PENDING':
      return FiClock;
    case 'REJECTED':
      return FiX;
    default:
      return FiClock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return COLORS.mint;
    case 'PENDING':
      return COLORS.gold;
    case 'REJECTED':
      return COLORS.coral;
    default:
      return COLORS.darkIndigo;
  }
};

export default function KYCPage() {
  const { user, _hasHydrated, fetchUser } = useUserStore();
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await api.get('/users/kyc-documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (_hasHydrated && user) {
      fetchDocuments();
    }
  }, [_hasHydrated, user, fetchDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a JPG or PNG image');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document_image', selectedFile);
      formData.append('document_type', selectedDocType);

      await api.post('/users/kyc-documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Document uploaded successfully! It will be reviewed shortly.');
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedDocType('');
      fetchDocuments();
      fetchUser();
    } catch (error: unknown) {
      let message = 'Failed to upload document';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        message = axiosError.response?.data?.detail || message;
      }
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const openUploadModal = (docType: string) => {
    setSelectedDocType(docType);
    setShowUploadModal(true);
  };

  const getDocumentForType = (docType: string) => {
    return documents.find(doc => doc.document_type === docType);
  };

  const canUploadForLevel = (level: KYCLevel) => {
    if (!level.documentType) return false;
    
    const existingDoc = getDocumentForType(level.documentType);
    // Allow upload if no document exists or if the previous was rejected
    return !existingDoc || existingDoc.status === 'REJECTED';
  };

  const getLevelStatus = (level: KYCLevel): 'completed' | 'current' | 'pending' | 'locked' => {
    if (!user) return 'locked';
    
    if (user.verification_level >= level.level) {
      return 'completed';
    }
    
    if (level.documentType) {
      const doc = getDocumentForType(level.documentType);
      if (doc?.status === 'PENDING') return 'pending';
    }
    
    if (user.verification_level === level.level - 1) {
      return 'current';
    }
    
    return 'locked';
  };

  if (!_hasHydrated || loading) {
    return <KYCSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p>Please log in to view your KYC status.</p>
      </div>
    );
  }

  const currentLevel = KYC_LEVELS[user.verification_level] || KYC_LEVELS[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: COLORS.indigo }}>
          KYC Verification
        </h1>
        <p className="mt-1" style={{ color: COLORS.darkIndigo }}>
          Complete verification levels to unlock more features and higher limits.
        </p>
      </motion.div>

      {/* Current Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-6 rounded-2xl shadow-lg border-2"
        style={{ borderColor: currentLevel.color }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${currentLevel.color}20` }}
            >
              <currentLevel.icon className="text-2xl" style={{ color: currentLevel.color }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Verification Level</p>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>
                Level {user.verification_level}: {currentLevel.name}
              </h2>
              <p className="text-sm" style={{ color: COLORS.darkIndigo }}>
                {currentLevel.description}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Your Daily Limit</p>
              <p className="text-3xl font-bold" style={{ color: currentLevel.color }}>
                ${['$50', '$500', '$2,000', '$10,000'][user.verification_level]}
              </p>
              {user.verification_level < 3 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Upgrade to unlock</p>
                  <p className="font-semibold text-sm" style={{ color: COLORS.mint }}>
                    ${['$500', '$2,000', '$10,000', 'Unlimited'][user.verification_level + 1]} daily
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Why Verify Banner */}
      {user.verification_level < 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="p-6 rounded-2xl shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.mint} 0%, ${COLORS.indigo} 100%)`,
            color: COLORS.white
          }}
        >
          <div className="flex items-start gap-4">
            <FiShield className="text-3xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-2">Why Complete Your Verification?</h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li>✓ Unlock higher transaction limits - send and receive more money</li>
                <li>✓ Access all platform features including business payments</li>
                <li>✓ Lower fees on larger transactions</li>
                <li>✓ Enhanced account security and fraud protection</li>
                <li>✓ Priority customer support</li>
                <li>✓ Compliance with financial regulations - keeps your money safe</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Verification Levels Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>
          Verification Levels & Limits
        </h2>
        <p className="text-gray-600 mb-6">
          Each level unlocks more features and higher transaction limits. Choose your path based on how you plan to use Ovii.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {KYC_LEVELS.map((level, index) => {
          const status = getLevelStatus(level);
          const Icon = level.icon;
          const canUpload = canUploadForLevel(level);
          const existingDoc = level.documentType ? getDocumentForType(level.documentType) : null;
          
          return (
            <motion.div
              key={level.level}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
              className={`relative bg-white p-6 rounded-2xl shadow-lg ${
                status === 'completed' ? 'border-2' : ''
              }`}
              style={{ 
                borderColor: status === 'completed' ? COLORS.mint : 'transparent',
                opacity: status === 'locked' ? 0.6 : 1
              }}
            >
              {/* Status Badge */}
              {status === 'completed' && (
                <div 
                  className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${COLORS.mint}20`, color: COLORS.mint }}
                >
                  <FiCheck className="text-sm" />
                  Verified
                </div>
              )}
              {status === 'pending' && (
                <div 
                  className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: `${COLORS.gold}20`, color: COLORS.gold }}
                >
                  <FiClock className="text-sm" />
                  Pending Review
                </div>
              )}
              {status === 'locked' && (
                <div 
                  className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: COLORS.lightGray, color: COLORS.darkIndigo }}
                >
                  <FiLock className="text-sm" />
                  Locked
                </div>
              )}

              {/* Level Header */}
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${level.color}20` }}
                >
                  <Icon className="text-xl" style={{ color: level.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg" style={{ color: COLORS.indigo }}>
                    Level {level.level}: {level.name}
                  </h3>
                  <p className="text-sm text-gray-500">{level.description}</p>
                </div>
              </div>

              {/* Transaction Limits */}
              <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: `${level.color}10` }}>
                <p className="text-xs text-gray-500 mb-1">Transaction Limits</p>
                <p className="text-2xl font-bold" style={{ color: level.color }}>
                  ${['$50', '$500', '$2,000', '$10,000'][level.level]}/day
                </p>
                {level.level >= 2 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Monthly: {level.level === 3 ? 'Unlimited' : `$${level.level === 2 ? '50,000' : 'N/A'}`}
                  </p>
                )}
              </div>

              {/* Requirements */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Requirements:</h4>
                <ul className="space-y-1">
                  {level.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                      <FiChevronRight className="mt-0.5 flex-shrink-0" style={{ color: level.color }} />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Benefits:</h4>
                <ul className="space-y-1">
                  {level.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: COLORS.mint }}>
                      <FiCheck className="mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Document Status */}
              {existingDoc && (
                <div 
                  className="mb-4 p-3 rounded-lg"
                  style={{ backgroundColor: `${getStatusColor(existingDoc.status)}10` }}
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const StatusIcon = getStatusIcon(existingDoc.status);
                      return <StatusIcon style={{ color: getStatusColor(existingDoc.status) }} />;
                    })()}
                    <span className="text-sm font-medium" style={{ color: getStatusColor(existingDoc.status) }}>
                      Document {existingDoc.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded on {new Date(existingDoc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {/* Action Button */}
              {level.documentType && status === 'current' && canUpload && (
                <motion.button
                  onClick={() => openUploadModal(level.documentType!)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors"
                  style={{ backgroundColor: level.color, color: COLORS.white }}
                >
                  <FiUpload />
                  Upload Document
                </motion.button>
              )}
              
              {status === 'locked' && (
                <p className="text-center text-sm text-gray-400">
                  Complete Level {level.level - 1} to unlock
                </p>
              )}
            </motion.div>
          );
        })}
        </div>
      </div>

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white p-6 rounded-2xl shadow-lg"
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.indigo }}>
          How KYC Verification Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${COLORS.gold}20` }}
            >
              <FiUpload className="text-2xl" style={{ color: COLORS.gold }} />
            </div>
            <h3 className="font-bold mb-2" style={{ color: COLORS.indigo }}>1. Upload Documents</h3>
            <p className="text-sm text-gray-500">
              Upload clear photos of your ID card, passport, or proof of address.
            </p>
          </div>
          <div className="text-center">
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${COLORS.mint}20` }}
            >
              <FiShield className="text-2xl" style={{ color: COLORS.mint }} />
            </div>
            <h3 className="font-bold mb-2" style={{ color: COLORS.indigo }}>2. Verification Review</h3>
            <p className="text-sm text-gray-500">
              Our team reviews your documents securely and typically within 24 hours.
            </p>
          </div>
          <div className="text-center">
            <div 
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${COLORS.indigo}20` }}
            >
              <FiCheckCircle className="text-2xl" style={{ color: COLORS.indigo }} />
            </div>
            <h3 className="font-bold mb-2" style={{ color: COLORS.indigo }}>3. Unlock Features</h3>
            <p className="text-sm text-gray-500">
              Once verified, enjoy higher limits and full access to Ovii features.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Important Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="p-6 rounded-2xl"
        style={{ backgroundColor: `${COLORS.gold}10`, border: `1px solid ${COLORS.gold}30` }}
      >
        <div className="flex items-start gap-3">
          <FiAlertCircle className="flex-shrink-0 mt-0.5" style={{ color: COLORS.gold }} />
          <div>
            <h3 className="font-semibold mb-2" style={{ color: COLORS.indigo }}>Important Notes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• All documents must be clear, legible, and not expired.</li>
              <li>• Maximum file size is 2MB. Accepted formats: JPG, PNG.</li>
              <li>• Proof of address must be dated within the last 3 months.</li>
              <li>• Your data is encrypted and stored securely.</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: COLORS.indigo }}>
                Upload Document
              </h2>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Document Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select document type</option>
                  <option value="ID_CARD">National ID Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="UTILITY_BILL">Utility Bill (Proof of Address)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Upload File
                </label>
                <div 
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  style={{ borderColor: selectedFile ? COLORS.mint : COLORS.lightGray }}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FiCheckCircle style={{ color: COLORS.mint }} />
                      <span className="text-sm" style={{ color: COLORS.mint }}>{selectedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="mx-auto text-2xl mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 2MB</p>
                    </>
                  )}
                </div>
              </div>

              <motion.button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !selectedDocType}
                whileHover={{ scale: uploading ? 1 : 1.02 }}
                whileTap={{ scale: uploading ? 1 : 0.98 }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.indigo }}
              >
                {uploading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FiUpload />
                    Upload Document
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

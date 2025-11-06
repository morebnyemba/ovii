'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBriefcase, FiMapPin, FiFileText, FiUpload, FiLoader, FiAlertCircle,
  FiArrowLeft, FiArrowRight, FiCheckCircle, FiUser, FiMail, FiPhone
} from 'react-icons/fi';
import api from '@/lib/api';
import { useUserStore } from '@/lib/store/useUserStore';

// Define colors for consistent theming
const COLORS = {
  indigo: '#1A1B4B',
  gold: '#FFC247',
  mint: '#33D9B2',
  coral: '#FF6B6B',
  white: '#FDFDFD',
  lightGray: '#F3F4F6',
  darkIndigo: '#0F0F2D',
};

// --- Step Components ---
interface StepProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: any;
  setErrors: React.Dispatch<React.SetStateAction<any>>;
}

const Step1PersonalDetails: React.FC<StepProps> = ({ formData, handleChange, errors }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>Your Details</h2>
    <p className="text-gray-600">Tell us a bit about yourself.</p>

    <div>
      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
      <input
        type="text"
        name="first_name"
        id="first_name"
        value={formData.first_name}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        required
      />
      {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
    </div>

    <div>
      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
      <input
        type="text"
        name="last_name"
        id="last_name"
        value={formData.last_name}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        required
      />
      {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
    </div>

    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
      <input
        type="email"
        name="email"
        id="email"
        value={formData.email}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        required
      />
      {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
    </div>

    <div>
      <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
      <input
        type="tel"
        name="phone_number"
        id="phone_number"
        value={formData.phone_number}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        required
      />
      {errors.phone_number && <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>}
    </div>
  </motion.div>
);

const Step2BusinessDetails: React.FC<StepProps> = ({ formData, handleChange, errors }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>Business Information</h2>
    <p className="text-gray-600">Details about your business operation.</p>

    <div>
      <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Business Name</label>
      <input
        type="text"
        name="business_name"
        id="business_name"
        value={formData.business_name}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        required
      />
      {errors.business_name && <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>}
    </div>

    <div>
      <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
      <input
        type="text"
        name="location"
        id="location"
        value={formData.location}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        required
      />
      {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
    </div>

    <div>
      <label htmlFor="business_address" className="block text-sm font-medium text-gray-700">Business Address</label>
      <input
        type="text"
        name="business_address"
        id="business_address"
        value={formData.business_address}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      {errors.business_address && <p className="mt-1 text-sm text-red-600">{errors.business_address}</p>}
    </div>

    <div>
      <label htmlFor="business_registration_number" className="block text-sm font-medium text-gray-700">Business Registration Number</label>
      <input
        type="text"
        name="business_registration_number"
        id="business_registration_number"
        value={formData.business_registration_number}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      {errors.business_registration_number && <p className="mt-1 text-sm text-red-600">{errors.business_registration_number}</p>}
    </div>
  </motion.div>
);

const Step3DocumentUpload: React.FC<StepProps> = ({ handleFileChange, errors, formData }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    <h2 className="text-2xl font-bold" style={{ color: COLORS.indigo }}>Documents</h2>
    <p className="text-gray-600">Upload required documents for verification.</p>

    <div>
      <label htmlFor="business_registration_document" className="block text-sm font-medium text-gray-700">Business Registration Document</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="business_registration_document_input"
              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <span>Upload a file</span>
              <input id="business_registration_document_input" name="business_registration_document" type="file" className="sr-only" onChange={handleFileChange} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
          {formData.businessRegistrationDocument && <p className="text-sm text-gray-500">{formData.businessRegistrationDocument.name}</p>}
        </div>
      </div>
      {errors.business_registration_document && <p className="mt-1 text-sm text-red-600">{errors.business_registration_document}</p>}
    </div>

    <div>
      <label htmlFor="proof_of_address_document" className="block text-sm font-medium text-gray-700">Proof of Address Document</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="proof_of_address_document_input"
              className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <span>Upload a file</span>
              <input id="proof_of_address_document_input" name="proof_of_address_document" type="file" className="sr-only" onChange={handleFileChange} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
          {formData.proofOfAddressDocument && <p className="text-sm text-gray-500">{formData.proofOfAddressDocument.name}</p>}
        </div>
      </div>
      {errors.proof_of_address_document && <p className="mt-1 text-sm text-red-600">{errors.proof_of_address_document}</p>}
    </div>
  </motion.div>
);

// --- Main Component ---
export default function BecomeAgentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    business_name: '',
    location: '',
    business_address: '',
    business_registration_number: '',
  });
  const [businessRegistrationDocument, setBusinessRegistrationDocument] = useState<File | null>(null);
  const [proofOfAddressDocument, setProofOfAddressDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const router = useRouter();
  const { user } = useUserStore();

  const steps = [
    { name: 'Personal Details', component: Step1PersonalDetails },
    { name: 'Business Details', component: Step2BusinessDetails },
    { name: 'Document Upload', component: Step3DocumentUpload },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null }); // Clear error on change
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'business_registration_document') {
      setBusinessRegistrationDocument(e.target.files ? e.target.files[0] : null);
    } else if (e.target.name === 'proof_of_address_document') {
      setProofOfAddressDocument(e.target.files ? e.target.files[0] : null);
    }
    setErrors({ ...errors, [e.target.name]: null }); // Clear error on change
  };

  const validateStep = () => {
    let newErrors: any = {};
    let isValid = true;

    switch (currentStep) {
      case 0: // Personal Details
        if (!formData.first_name) newErrors.first_name = 'First Name is required.';
        if (!formData.last_name) newErrors.last_name = 'Last Name is required.';
        if (!formData.email) newErrors.email = 'Email is required.';
        if (!formData.phone_number) newErrors.phone_number = 'Phone Number is required.';
        break;
      case 1: // Business Details
        if (!formData.business_name) newErrors.business_name = 'Business Name is required.';
        if (!formData.location) newErrors.location = 'Location is required.';
        break;
      case 2: // Document Upload
        // Optional for now, but can be made required
        break;
    }

    setErrors(newErrors);
    isValid = Object.keys(newErrors).length === 0;
    return isValid;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setErrors({});

    const data = new FormData();
    // Append all form data
    Object.keys(formData).forEach(key => {
      data.append(key, (formData as any)[key]);
    });
    if (businessRegistrationDocument) {
      data.append('business_registration_document', businessRegistrationDocument);
    }
    if (proofOfAddressDocument) {
      data.append('proof_of_address_document', proofOfAddressDocument);
    }

    try {
      await api.post('/agents/onboarding/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      router.push('/agents/pending-approval');
    } catch (err: any) {
      const apiErrors = err.response?.data;
      if (apiErrors) {
        setErrors(apiErrors);
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center p-4 md:p-8 bg-gray-100"
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-2xl bg-white p-8 shadow-lg"
        >
          <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.indigo }}>Become an Ovii Agent</h1>
          <p className="text-gray-600 mb-8">Submit your details to start your journey as an Ovii agent.</p>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold mb-2">
              {steps.map((step, index) => (
                <span key={index} style={{ color: index <= currentStep ? COLORS.indigo : COLORS.lightGray }}>
                  {step.name}
                </span>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: COLORS.mint }}
                initial={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              <CurrentStepComponent
                key={currentStep}
                formData={formData}
                handleChange={handleInputChange}
                handleFileChange={handleFileChange}
                errors={errors}
                setErrors={setErrors}
              />
            </AnimatePresence>

            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{errors.general}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {currentStep > 0 && (
                <motion.button
                  type="button"
                  onClick={handlePrevious}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiArrowLeft className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                  Previous
                </motion.button>
              )}

              {currentStep < steps.length - 1 && (
                <motion.button
                  type="button"
                  onClick={handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Next
                  <FiArrowRight className="-mr-1 ml-2 h-5 w-5" />
                </motion.button>
              )}

              {currentStep === steps.length - 1 && (
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="ml-auto inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-mint-600 hover:bg-mint-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mint-500"
                  style={{ backgroundColor: COLORS.mint, color: COLORS.indigo }}
                >
                  {loading ? <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <FiCheckCircle className="-ml-1 mr-2 h-5 w-5" />}
                  {loading ? 'Submitting...' : 'Submit Application'}
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </motion.main>
  );
}

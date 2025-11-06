'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiBriefcase, FiMapPin, FiFileText, FiUpload, FiLoader, FiAlertCircle } from 'react-icons/fi';
import api from '@/lib/api';
import { useUserStore } from '@/lib/store/useUserStore';

export default function BecomeAgentPage() {
  const [formData, setFormData] = useState({
    business_name: '',
    location: '',
    business_address: '',
    business_registration_number: '',
  });
  const [businessRegistrationDocument, setBusinessRegistrationDocument] = useState<File | null>(null);
  const [proofOfAddressDocument, setProofOfAddressDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useUserStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'business_registration_document') {
      setBusinessRegistrationDocument(e.target.files ? e.target.files[0] : null);
    } else if (e.target.name === 'proof_of_address_document') {
      setProofOfAddressDocument(e.target.files ? e.target.files[0] : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('business_name', formData.business_name);
    data.append('location', formData.location);
    data.append('business_address', formData.business_address);
    data.append('business_registration_number', formData.business_registration_number);
    if (businessRegistrationDocument) {
      data.append('business_registration_document', businessRegistrationDocument);
    }
    if (proofOfAddressDocument) {
      data.append('proof_of_address_document', proofOfAddressDocument);
    }

    try {
      await api.post('/agents/onboard/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Redirect to a page that informs the user that their application is under review
      router.push('/agents/pending-approval');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-screen items-center justify-center p-4 md:p-8"
    >
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="rounded-2xl bg-white p-8 shadow-lg"
        >
          <h1 className="text-3xl font-bold mb-2">Become an Ovii Agent</h1>
          <p className="text-gray-600 mb-8">Submit your details to start your journey as an Ovii agent.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Business Name</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <FiBriefcase className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400" />
                  <input
                    type="text"
                    name="business_name"
                    id="business_name"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <FiMapPin className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    id="location"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="business_address" className="block text-sm font-medium text-gray-700">Business Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="business_address"
                  id="business_address"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  value={formData.business_address}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="business_registration_number" className="block text-sm font-medium text-gray-700">Business Registration Number</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <FiFileText className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400" />
                <input
                  type="text"
                  name="business_registration_number"
                  id="business_registration_number"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  value={formData.business_registration_number}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    {businessRegistrationDocument && <p className="text-sm text-gray-500">{businessRegistrationDocument.name}</p>}
                  </div>
                </div>
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
                    {proofOfAddressDocument && <p className="text-sm text-gray-500">{proofOfAddressDocument.name}</p>}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? <FiLoader className="animate-spin h-5 w-5 text-white" /> : 'Submit Application'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LoginPage() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/users/otp/request/', { phone_number: phoneNumber });
            // Store phone number to use on the verification page
            localStorage.setItem('phone_for_verification', phoneNumber);
            router.push('/verify-otp');
        } catch (err) {
            setError('Failed to send OTP. Please check the number and try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-6 text-center text-ovii-indigo">Welcome to Ovii</h1>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+263787211325"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-ovii-gold focus:border-ovii-gold"
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-ovii-gold text-ovii-indigo font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:bg-gray-400">
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>
            </div>
        </div>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function VerifyOTPPage() {
    const [otp, setOtp] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Retrieve the phone number from local storage
        const storedPhoneNumber = localStorage.getItem('phone_for_verification');
        if (storedPhoneNumber) {
            setPhoneNumber(storedPhoneNumber);
        } else {
            // If no phone number is found, redirect back to login
            router.push('/login');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/users/otp/verify/', {
                phone_number: phoneNumber,
                code: otp,
            });

            // On successful verification, store tokens and redirect
            const { access, refresh } = response.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            
            router.push('/'); // Redirect to the dashboard

        } catch (err) {
            setError('Invalid OTP. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[--ovii-off-white]">
            <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-2 text-center text-[--ovii-indigo]">Verify Your Phone</h1>
                <p className="text-center text-gray-600 mb-6">Enter the code sent to {phoneNumber}</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                        <input
                            type="number"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[--ovii-gold] focus:border-[--ovii-gold] text-center tracking-[0.5em]"
                            required
                        />
                    </div>
                    {error && <p className="text-[--ovii-coral] text-sm mb-4">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full bg-[--ovii-gold] text-[--ovii-indigo] font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors disabled:bg-gray-400">
                        {loading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
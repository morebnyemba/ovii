'use client';

import { useEffect, useState } from 'react';
import api from '../../lib/api';
import Link from 'next/link'; 

interface Wallet {
    balance: string;
    currency: string;
}

export default function DashboardPage() {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const response = await api.get('/wallets/me/');
                setWallet(response.data);
            } catch (err) {
                setError('Could not fetch wallet details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchWallet();
    }, []);

    if (loading) return <div className="text-center p-10">Loading Dashboard...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-ovii-indigo mb-6">My Wallet</h1>
            <div className="bg-white p-8 rounded-lg shadow-md">
                <p className="text-lg text-gray-600">Current Balance</p>
                <p className="text-5xl font-bold text-ovii-indigo mt-2">
                    {wallet?.currency} ${parseFloat(wallet?.balance || '0').toFixed(2)}
                </p>
                <div className="mt-8 flex space-x-4">
                    <Link href="/send" className="bg-ovii-gold text-ovii-indigo font-bold py-3 px-6 rounded-md hover:bg-opacity-90 transition-colors">Send Money</Link>
                    <Link href="/history" className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-md hover:bg-gray-300 transition-colors">Transaction History</Link>
                </div>
            </div>
        </div>
    );
}
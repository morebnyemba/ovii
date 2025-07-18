'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
            // Instead of localStorage, we now send the token to our own API route to set as a secure cookie.
            await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ access, refresh }), // Sending refresh token is optional for this step but good practice
            });

            router.push('/'); // Redirect to the dashboard

        } catch (err) {
            setError('Invalid OTP. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl text-[--ovii-indigo]">Verify Your Phone</CardTitle>
                    <CardDescription>
                        Enter the code sent to {phoneNumber}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="otp">Verification Code</Label>
                            <Input
                                id="otp"
                                type="tel"
                                inputMode="numeric"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="text-center tracking-[0.5em]"
                            />
                        </div>
                        {error && <p className="text-[--ovii-coral] text-sm">{error}</p>}
                        <Button type="submit" className="w-full bg-[--ovii-gold] text-[--ovii-indigo] hover:bg-[--ovii-gold]/90" disabled={loading}>
                            {loading ? "Verifying..." : "Verify & Login"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
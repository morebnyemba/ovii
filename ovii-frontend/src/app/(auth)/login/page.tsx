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
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-[--ovii-indigo]">Welcome to Ovii</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+263 71 234 5678"
                                required
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-[--ovii-coral] text-sm">{error}</p>}
                        <Button type="submit" className="w-full bg-[--ovii-gold] text-[--ovii-indigo] hover:bg-[--ovii-gold]/90" disabled={loading}>
                            {loading ? "Sending..." : "Send OTP"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
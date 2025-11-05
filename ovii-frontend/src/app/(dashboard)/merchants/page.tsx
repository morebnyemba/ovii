"use client";

import React, { useEffect } from "react";
import { useUserStore } from "@/lib/store/useUserStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const MerchantDashboardPage = () => {
  const { user, fetchUser, fetchWallet, wallet, fetchTransactions, transactions } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (user && user.verification_level === 0) {
      toast.error("Please complete your KYC verification to access all features.");
      // Optionally redirect to KYC page
    }
    if (user && user.role !== "MERCHANT") {
      router.push("/dashboard"); // Redirect if not a merchant
    }
    fetchUser();
    fetchWallet();
    fetchTransactions();
  }, [user, fetchUser, fetchWallet, fetchTransactions, router]);

  if (!user || user.role !== "MERCHANT") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading merchant dashboard or redirecting...</p>
      </div>
    );
  }

  const merchantProfile = user.merchant_profile; // Assuming merchant_profile is attached to user

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Welcome, {merchantProfile?.business_name || user.first_name}!</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallet?.balance || "0.00"} {wallet?.currency || "ZWL"}</div>
            <p className="text-xs text-muted-foreground">
              Your current available balance.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Key</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M15 5.5V8h2.5L12 12.5 6.5 7H9V4.5L15 5.5z" />
              <path d="M12 12.5L17.5 7H15V4.5L12 0 6.5 4.5H9V7L12 12.5z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{merchantProfile?.api_key || "N/A"}</div>
            <p className="text-xs text-muted-foreground">
              Use this for your integrations.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M17 14V12a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2" />
              <path d="M12 10V3" />
              <path d="M12 21V14" />
              <path d="M17 14h-2.5l-2.5 2.5-2.5-2.5H7" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              All time transactions.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                  <p className={`text-lg font-bold ${tx.amount.startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>
                    {tx.amount} {wallet?.currency || "ZWL"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p>No recent transactions.</p>
        )}
        <Button variant="link" className="mt-4" onClick={() => router.push("/merchants/transactions")}>
          View All Transactions
        </Button>
      </div>
    </div>
  );
};

export default MerchantDashboardPage;

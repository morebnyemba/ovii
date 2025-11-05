"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserStore } from "@/lib/store/useUserStore";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const cashInSchema = z.object({
  customer_phone_number: z.string().min(10, "Please enter a valid phone number"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

const cashOutSchema = z.object({
  customer_phone_number: z.string().min(10, "Please enter a valid phone number"),
  amount: z.coerce.number().positive("Amount must be positive"),
});

type CashInFormValues = z.infer<typeof cashInSchema>;
type CashOutFormValues = z.infer<typeof cashOutSchema>;

const CashInOutPage = () => {
  const router = useRouter();
  const { user, fetchWallet } = useUserStore();

  const {
    register: registerCashIn,
    handleSubmit: handleSubmitCashIn,
    formState: { errors: errorsCashIn, isSubmitting: isSubmittingCashIn },
    reset: resetCashIn,
  } = useForm<CashInFormValues>({
    resolver: zodResolver(cashInSchema),
  });

  const {
    register: registerCashOut,
    handleSubmit: handleSubmitCashOut,
    formState: { errors: errorsCashOut, isSubmitting: isSubmittingCashOut },
    reset: resetCashOut,
  } = useForm<CashOutFormValues>({
    resolver: zodResolver(cashOutSchema),
  });

  const onCashInSubmit = async (data: CashInFormValues) => {
    try {
      await api.post("/agents/cash-in/", data);
      fetchWallet();
      toast.success("Cash-in successful!");
      resetCashIn();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Cash-in failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  const onCashOutSubmit = async (data: CashOutFormValues) => {
    try {
      await api.post("/agents/cash-out/", data);
      fetchWallet();
      toast.success("Cash-out successful!");
      resetCashOut();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Cash-out failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (!user || user.role !== "AGENT") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Cash In / Cash Out</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Cash In (Deposit)</h2>
          <form onSubmit={handleSubmitCashIn(onCashInSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="cash_in_customer_phone_number">Customer Phone Number</Label>
              <Input
                id="cash_in_customer_phone_number"
                {...registerCashIn("customer_phone_number")}
                className="mt-1"
              />
              {errorsCashIn.customer_phone_number && (
                <p className="text-red-500 text-sm mt-1">{errorsCashIn.customer_phone_number.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cash_in_amount">Amount</Label>
              <Input
                id="cash_in_amount"
                type="number"
                {...registerCashIn("amount")}
                className="mt-1"
              />
              {errorsCashIn.amount && (
                <p className="text-red-500 text-sm mt-1">{errorsCashIn.amount.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmittingCashIn}>
              {isSubmittingCashIn ? "Processing..." : "Process Cash In"}
            </Button>
          </form>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-4">Cash Out (Withdrawal)</h2>
          <form onSubmit={handleSubmitCashOut(onCashOutSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="cash_out_customer_phone_number">Customer Phone Number</Label>
              <Input
                id="cash_out_customer_phone_number"
                {...registerCashOut("customer_phone_number")}
                className="mt-1"
              />
              {errorsCashOut.customer_phone_number && (
                <p className="text-red-500 text-sm mt-1">{errorsCashOut.customer_phone_number.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="cash_out_amount">Amount</Label>
              <Input
                id="cash_out_amount"
                type="number"
                {...registerCashOut("amount")}
                className="mt-1"
              />
              {errorsCashOut.amount && (
                <p className="text-red-500 text-sm mt-1">{errorsCashOut.amount.message}</p>
              )}
            </div>
            <Button type="submit" disabled={isSubmittingCashOut}>
              {isSubmittingCashOut ? "Processing..." : "Process Cash Out"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CashInOutPage;

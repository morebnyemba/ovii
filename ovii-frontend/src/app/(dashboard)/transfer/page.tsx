"use client";

import React, { useState, useEffect } from "react";
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
import { Decimal } from "decimal.js";

const transferSchema = z.object({
  destination_phone_number: z.string().min(10, "Please enter a valid phone number"),
  amount: z.coerce.number().positive("Amount must be positive"),
  pin: z.string().length(4, "PIN must be 4 digits"),
  description: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

const TransferPage = () => {
  const router = useRouter();
  const { user, fetchWallet } = useUserStore();
  const [charge, setCharge] = useState<Decimal | null>(null);
  const [amount, setAmount] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
  });

  useEffect(() => {
    const fetchCharge = async () => {
      if (amount) {
        try {
          const response = await api.get(
            `/wallets/get-charge/?transaction_type=TRANSFER&amount=${amount}`
          );
          setCharge(new Decimal(response.data.charge_amount));
        } catch (error) {
          console.error("Failed to fetch charge:", error);
        }
      } else {
        setCharge(null);
      }
    };
    fetchCharge();
  }, [amount]);

  const onSubmit = async (data: TransferFormValues) => {
    try {
      await api.post("/wallets/transfer/", data);
      fetchWallet();
      toast.success("Transfer successful!");
      reset();
      setCharge(null);
      setAmount("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Transfer failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading or redirecting...</p>
      </div>
    );
  }

  const totalDeduction = charge ? new Decimal(amount || 0).plus(charge) : new Decimal(amount || 0);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Send Money</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <div>
          <Label htmlFor="destination_phone_number">Recipient's Phone Number</Label>
          <Input
            id="destination_phone_number"
            {...register("destination_phone_number")}
            className="mt-1"
          />
          {errors.destination_phone_number && (
            <p className="text-red-500 text-sm mt-1">{errors.destination_phone_number.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            {...register("amount")}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>
        {charge && (
          <div className="text-sm text-muted-foreground">
            <p>Transaction Charge: {charge.toString()}</p>
            <p>Total Deduction: {totalDeduction.toString()}</p>
          </div>
        )}
        <div>
          <Label htmlFor="pin">Transaction PIN</Label>
          <Input
            id="pin"
            type="password"
            {...register("pin")}
            className="mt-1"
          />
          {errors.pin && (
            <p className="text-red-500 text-sm mt-1">{errors.pin.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            {...register("description")}
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Money"}
        </Button>
      </form>
    </div>
  );
};

export default TransferPage;

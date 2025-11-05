"use client";

import React, { useEffect } from "react";
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

const settingsSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_registration_number: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  webhook_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  return_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const MerchantSettingsPage = () => {
  const router = useRouter();
  const { user, fetchUser } = useUserStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (user && user.role !== "MERCHANT") {
      router.push("/dashboard"); // Redirect if not a merchant
    }
    if (user?.merchant_profile) {
      reset({
        business_name: user.merchant_profile.business_name,
        business_registration_number: user.merchant_profile.business_registration_number || "",
        website: user.merchant_profile.website || "",
        webhook_url: user.merchant_profile.webhook_url || "",
        return_url: user.merchant_profile.return_url || "",
      });
    }
  }, [user, reset, router]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await api.patch("/merchants/profile/", data);
      fetchUser(); // Refresh user data to update the store
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (!user || user.role !== "MERCHANT") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading settings or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Merchant Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
        <div>
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            {...register("business_name")}
            className="mt-1"
          />
          {errors.business_name && (
            <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="business_registration_number">Business Registration Number</Label>
          <Input
            id="business_registration_number"
            {...register("business_registration_number")}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            {...register("website")}
            className="mt-1"
          />
          {errors.website && (
            <p className="text-red-500 text-sm mt-1">{errors.website.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="webhook_url">Webhook URL</Label>
          <Input
            id="webhook_url"
            {...register("webhook_url")}
            className="mt-1"
          />
          {errors.webhook_url && (
            <p className="text-red-500 text-sm mt-1">{errors.webhook_url.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="return_url">Return URL</Label>
          <Input
            id="return_url"
            {...register("return_url")}
            className="mt-1"
          />
          {errors.return_url && (
            <p className="text-red-500 text-sm mt-1">{errors.return_url.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default MerchantSettingsPage;

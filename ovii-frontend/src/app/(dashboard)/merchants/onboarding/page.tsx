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

const onboardingSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  business_registration_number: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional(),
  webhook_url: z.string().url("Please enter a valid URL").optional(),
  return_url: z.string().url("Please enter a valid URL").optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const MerchantOnboardingPage = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingFormValues) => {
    try {
      await api.post("/merchants/onboarding/", data);
      toast.success("Onboarding successful! Your application is under review.");
      router.push("/merchants");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Onboarding failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Merchant Onboarding</h1>
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
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </form>
    </div>
  );
};

export default MerchantOnboardingPage;

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
  location: z.string().min(2, "Location must be at least 2 characters"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const AgentSettingsPage = () => {
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
    if (user && user.role !== "AGENT") {
      router.push("/dashboard"); // Redirect if not an agent
    }
    if (user?.agent_profile) {
      reset({
        business_name: user.agent_profile.business_name,
        location: user.agent_profile.location,
      });
    }
  }, [user, reset, router]);

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      await api.patch("/agents/profile/", data);
      fetchUser(); // Refresh user data to update the store
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to update profile. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (!user || user.role !== "AGENT") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading settings or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Agent Settings</h1>
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
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...register("location")}
            className="mt-1"
          />
          {errors.location && (
            <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
};

export default AgentSettingsPage;

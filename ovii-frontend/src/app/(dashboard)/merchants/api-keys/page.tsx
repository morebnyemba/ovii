"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/useUserStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import api from "@/lib/api";

const ApiKeysPage = () => {
  const { user, fetchUser } = useUserStore();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.merchant_profile?.api_key) {
      setApiKey(user.merchant_profile.api_key);
    }
  }, [user]);

  const handleRegenerateApiKey = async () => {
    setLoading(true);
    try {
      const response = await api.post("/merchants/profile/regenerate-key/");
      setApiKey(response.data.api_key);
      fetchUser(); // Refresh user data to update the store
      toast.success("API Key regenerated successfully!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to regenerate API Key.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "MERCHANT") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">API Keys</h1>

      <div className="space-y-4 max-w-lg">
        <div>
          <Label htmlFor="api_key">Your API Key</Label>
          <Input
            id="api_key"
            type="text"
            value={apiKey || ""}
            readOnly
            className="mt-1 font-mono"
          />
        </div>
        <Button onClick={handleRegenerateApiKey} disabled={loading}>
          {loading ? "Regenerating..." : "Regenerate API Key"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Regenerating your API key will invalidate the old one. Update your integrations accordingly.
        </p>
      </div>
    </div>
  );
};

export default ApiKeysPage;

"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/useUserStore";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import toast from "react-hot-toast";
import api from "@/lib/api";

const CommissionsPage = () => {
  const { user, wallet } = useUserStore();
  const router = useRouter();
  const [commissions, setCommissions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "AGENT") {
      router.push("/dashboard"); // Redirect if not an agent
    }
    fetchCommissions(currentPage);
  }, [user, currentPage, router]);

  const fetchCommissions = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/agents/commissions/?page=${page}`);
      setCommissions(response.data.results);
      setTotalPages(response.data.total_pages);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Could not fetch commission history.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== "AGENT") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading commissions or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Commission History</h1>

      {loading ? (
        <p>Loading commissions...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : commissions.length > 0 ? (
        <div className="space-y-4">
          {commissions.map((tx: any) => (
            <Card key={tx.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <p className="text-lg font-bold text-green-500">
                  +{tx.amount} {wallet?.currency || "ZWL"}
                </p>
              </CardContent>
            </Card>
          ))}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  isActive={currentPage > 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  isActive={currentPage < totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : (
        <p>No commission history found.</p>
      )}
    </div>
  );
};

export default CommissionsPage;

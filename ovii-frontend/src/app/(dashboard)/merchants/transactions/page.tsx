"use client";

import React, { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/useUserStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const MerchantTransactionsPage = () => {
  const {
    user,
    transactions,
    fetchTransactions,
    currentPage,
    totalPages,
    loading,
    error,
    wallet,
  } = useUserStore();
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user && user.role !== "MERCHANT") {
      router.push("/dashboard"); // Redirect if not a merchant
    }
    fetchTransactions(page);
  }, [user, page, fetchTransactions, router]);

  useEffect(() => {
    if (error.transactions) {
      toast.error(error.transactions);
    }
  }, [error.transactions]);

  if (!user || user.role !== "MERCHANT") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading transactions or redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Merchant Transaction History</h1>

      {loading.transactions ? (
        <p>Loading transactions...</p>
      ) : transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <Card key={tx.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold">{tx.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <p
                  className={`text-lg font-bold ${
                    tx.amount.startsWith("-") ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {tx.amount} {wallet?.currency || "ZWL"}
                </p>
              </CardContent>
            </Card>
          ))}
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  isActive={currentPage > 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={() => setPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  isActive={currentPage < totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : (
        <p>No transactions found.</p>
      )}
    </div>
  );
};

export default MerchantTransactionsPage;

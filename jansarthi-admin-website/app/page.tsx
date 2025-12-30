"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
          <span className="text-white text-2xl font-bold">PWD</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">जनसार्थी</h1>
        <p className="text-gray-600">PWD Admin Dashboard</p>
        <div className="flex justify-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full animate-pulse" />
          <Skeleton className="h-2 w-2 rounded-full animate-pulse delay-75" />
          <Skeleton className="h-2 w-2 rounded-full animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}

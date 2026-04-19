"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      setAuthReady(true);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {authReady ? (
        children
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export function useAdminAuth() {
  const queryClient = useQueryClient();
  
  const { data: admin, isLoading } = useQuery({
    queryKey: ["/api/admin/current-admin"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    // Clear admin from cache
    queryClient.setQueryData(["/api/admin/current-admin"], null);
    localStorage.removeItem("adminLoggedIn");
  };

  const login = (username: string) => {
    // Optimistically update cache or just invalidate
    queryClient.setQueryData(["/api/admin/current-admin"], { username });
    localStorage.setItem("adminLoggedIn", "true");
    // Invalidate to get fresh data if needed, but setQueryData is faster for instant redirect
  };

  return {
    isAdminLoggedIn: !!admin,
    adminUsername: admin?.username,
    isLoading,
    logout,
    login,
  };
}

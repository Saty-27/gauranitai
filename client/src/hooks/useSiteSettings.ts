import { useQuery } from "@tanstack/react-query";

export interface SiteSettings {
  id?: number;
  brandName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  updatedAt?: string;
}

export function useSiteSettings() {
  const { data: settings, isLoading, error } = useQuery<SiteSettings>({
    queryKey: ["site-settings"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/site-settings");
        if (!res.ok) throw new Error("Failed to fetch site settings");
        return res.json();
      } catch (err) {
        console.error("Site settings fetch error:", err);
        return { 
          brandName: "Gauranitai", 
          logoUrl: null,
          faviconUrl: null,
          primaryColor: "#0D3E83",
          secondaryColor: "#FFF9F2"
        };
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    settings: settings || { 
      brandName: "Gauranitai", 
      logoUrl: null,
      faviconUrl: null,
      primaryColor: "#0D3E83",
      secondaryColor: "#FFF9F2"
    },
    isLoading,
    error
  };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetchJson";
import type { TenantBranding } from "@/lib/branding-client";

export const BRANDING_KEY = ["branding"] as const;

export function useBrandingQuery() {
  return useQuery({
    queryKey: BRANDING_KEY,
    queryFn: () => fetchJson<TenantBranding>("/tenant/branding"),
  });
}

export function useSaveBrandingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (colors: Pick<TenantBranding, "primary_color" | "secondary_color" | "accent_color">) =>
      fetchJson<TenantBranding>("/tenant/branding", { method: "PATCH", body: JSON.stringify(colors) }),
    onSuccess: (data) => {
      queryClient.setQueryData(BRANDING_KEY, data);
    },
  });
}

export function useUploadLogoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      return fetchJson<TenantBranding>("/tenant/branding/logo", { method: "POST", body: formData });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(BRANDING_KEY, data);
    },
  });
}

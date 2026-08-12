import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/fetchJson";
import type { TenantDocument, UploadResult } from "@/lib/documents-client";

export const DOCUMENTS_KEY = ["documents"] as const;

export function useDocumentsQuery() {
  return useQuery({
    queryKey: DOCUMENTS_KEY,
    queryFn: () => fetchJson<TenantDocument[]>("/tenant/documents"),
    // Ingestion finishes asynchronously on the server -- poll while anything
    // is still Pending so the status column updates without a manual refresh.
    refetchInterval: (query) => (query.state.data?.some((d) => d.status === "Pending") ? 3000 : false),
  });
}

export function useUploadDocumentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (files: FileList): Promise<UploadResult[]> => {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);
      const res = await fetch("/tenant/documents", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok && !body.results) {
        throw new Error(typeof body.error === "string" ? body.error : "Upload failed");
      }
      return body.results as UploadResult[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_KEY });
    },
  });
}

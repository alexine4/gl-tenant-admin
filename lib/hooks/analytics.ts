import { useQuery } from "@tanstack/react-query";
import { readJsonOrThrow } from "@/lib/fetchJson";
import type { AnalyticsResponse } from "@/lib/analytics-client";

export function useAnalyticsQuery(from: string, to: string) {
  return useQuery({
    queryKey: ["analytics", from, to],
    queryFn: async () => {
      const res = await fetch(`/tenant/analytics?from=${from}&to=${to}`);
      return readJsonOrThrow<AnalyticsResponse>(res);
    },
    // Refetch keeps the previous render until the new data is ready -- no
    // intermediate null flash while switching date ranges.
    placeholderData: (prev) => prev,
  });
}

export async function exportAnalytics(from: string, to: string, format: "csv" | "json"): Promise<Blob> {
  const res = await fetch(`/tenant/analytics/export?from=${from}&to=${to}&format=${format}`);
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

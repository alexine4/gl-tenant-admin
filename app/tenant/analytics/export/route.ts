import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { buildAnalyticsResponse, parseDateRange, toCsv } from "@/lib/analytics";

export const GET = withAuth(async (request, _ctx, auth) => {
  const url = new URL(request.url);
  const range = parseDateRange(url.searchParams);
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }
  const format = url.searchParams.get("format") === "json" ? "json" : "csv";

  const data = buildAnalyticsResponse(auth.tenant_id, range);
  const fileBase = `analytics-${auth.tenant_id}-${range.from}_to_${range.to}`;

  if (format === "json") {
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileBase}.json"`,
      },
    });
  }

  return new NextResponse(toCsv(data), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${fileBase}.csv"`,
    },
  });
});

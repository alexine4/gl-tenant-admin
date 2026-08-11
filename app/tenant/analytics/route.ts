import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { buildAnalyticsResponse, parseDateRange } from "@/lib/analytics";

export const GET = withAuth(async (request, _ctx, auth) => {
  const range = parseDateRange(new URL(request.url).searchParams);
  if ("error" in range) {
    return NextResponse.json({ error: range.error }, { status: 400 });
  }

  return NextResponse.json(buildAnalyticsResponse(auth.tenant_id, range));
});

import { NextResponse } from "next/server";
import { authErrorResponse, requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    return NextResponse.json({
      user_id: auth.sub,
      email: auth.email,
      display_name: auth.display_name,
      tenant_id: auth.tenant_id,
      role: auth.role,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}

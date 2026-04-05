import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const FALLBACK = "/favicon.svg";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${API_URL}/settings/footer`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.logoUrl) {
        return NextResponse.redirect(data.logoUrl, 302);
      }
    }
  } catch {
    /* fall through to fallback */
  }

  // Use request origin so we don't depend on a potentially unresolvable domain
  const origin = request.nextUrl.origin;
  return NextResponse.redirect(new URL(FALLBACK, origin), 302);
}

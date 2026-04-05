import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/forum",
  "/checkout",
  "/checkout/shipping",
  "/checkout/payment",
  "/checkout/review",
];
const protectedPaths = [
  "/profile",
  "/orders",
  "/admin",
  "/admin/products",
  "/admin/products/create",
  "/admin/products/[id]/edit",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("\n🔍 ============ MIDDLEWARE START ============");
  console.log("📌 Pathname:", pathname);

  const accessToken = request.cookies.get("access_token");
  const refreshToken = request.cookies.get("refresh_token");

  console.log("🍪 Cookies found:");
  console.log("   - access_token:", accessToken ? "EXISTS ✅" : "MISSING ❌");
  console.log("   - refresh_token:", refreshToken ? "EXISTS ✅" : "MISSING ❌");

  const hasTokens = accessToken || refreshToken;
  const isAuthenticated = Boolean(hasTokens);

  console.log("🔐 Is Authenticated:", isAuthenticated);

  // Skip middleware for non-relevant paths (like api, _next, static files)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    console.log("➡️ Skipping middleware for:", pathname);
    console.log("🔍 ============ MIDDLEWARE END ============\n");
    return NextResponse.next();
  }

  // თუ მომხმარებელი ავტორიზებულია და publicPaths-ია, გავუშვათ
  if (isAuthenticated && publicPaths.includes(pathname)) {
    console.log("✅ Authenticated user accessing public path:", pathname);
    console.log("🔍 ============ MIDDLEWARE END ============\n");
    return NextResponse.next();
  }

  // თუ მომხმარებელი **არ არის** ავტორიზებული და სარეზერვო პაროლის გვერდზეა, უნდა შევუშვათ
  if (!isAuthenticated && publicPaths.includes(pathname)) {
    console.log("🛑 Unauthenticated user accessing public path:", pathname);
    console.log("🔍 ============ MIDDLEWARE END ============\n");
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access protected pages
  if (
    !isAuthenticated &&
    protectedPaths.some((path) => {
      const isProtected = pathname.startsWith(path);
      console.log(
        `   Checking path ${pathname} against ${path}: ${isProtected}`
      );
      return isProtected;
    })
  ) {
    console.log("🚨 REDIRECTING to /login - no auth tokens found");
    console.log("🔍 ============ MIDDLEWARE END ============\n");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log("✅ Allowing request to proceed");
  console.log("🔍 ============ MIDDLEWARE END ============\n");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};

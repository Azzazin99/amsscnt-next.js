import { auth } from "@/auth";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  // 1. IP restriction check
  if (
    !pathname.startsWith("/access-denied") &&
    !pathname.startsWith("/api/internal/check-ip") &&
    !pathname.startsWith("/_next") &&
    pathname !== "/favicon.ico"
  ) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    let clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || "127.0.0.1";

    if (clientIp === "::ffff:127.0.0.1") {
      clientIp = "127.0.0.1";
    }

    try {
      const checkUrl = new URL("/api/internal/check-ip", req.nextUrl.origin);
      checkUrl.searchParams.set("ip", clientIp);

      const response = await fetch(checkUrl.toString(), {
        headers: {
          "x-middleware-request": "true",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.allowed === false) {
          return Response.redirect(new URL("/access-denied", req.nextUrl.origin));
        }
      }
    } catch (error) {
      console.error("Proxy IP check error:", error);
    }
  }

  // 2. Auth check for protected routes
  if (!req.auth && pathname.startsWith("/home")) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
  if (!req.auth && pathname.startsWith("/modules")) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/((?!access-denied|api/internal/check-ip|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};

import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (!req.auth && pathname.startsWith("/home")) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
  if (!req.auth && pathname.startsWith("/modules")) {
    return Response.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/home/:path*", "/modules/:path*"],
};

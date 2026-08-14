import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedPaths = ["/onboarding", "/dashboard", "/projects"];

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const isSignIn = pathname === "/sign-in";
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if (!isSignIn && !isProtected) {
      return NextResponse.next();
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      if (isProtected) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
      return NextResponse.next();
    }

    if (isSignIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("proxy middleware error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/sign-in",
    "/onboarding",
    "/dashboard",
    "/dashboard/:path*",
    "/projects/:path*",
  ],
};
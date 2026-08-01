import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedPaths = ["/w", "/workspace", "/onboarding", "/dashboard"];

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

    const organizations = await auth.api.listOrganizations({
      headers: request.headers,
    });
    const hasOrganization =
      Array.isArray(organizations) && organizations.length > 0;

    if (isSignIn) {
      return NextResponse.redirect(
        new URL(hasOrganization ? "/workspace" : "/onboarding", request.url),
      );
    }

    // Require Organization for /w and /workspace
    if ((pathname.startsWith("/w") || pathname.startsWith("/workspace")) && !hasOrganization) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // Don't let users with an organization go to /onboarding
    if (pathname.startsWith("/onboarding") && hasOrganization) {
      return NextResponse.redirect(new URL("/workspace", request.url));
    }

    if (pathname === "/dashboard") {
      return NextResponse.redirect(
        new URL(hasOrganization ? "/workspace" : "/onboarding", request.url),
      );
    }

    return NextResponse.next();
  } catch (err) {
    console.error("proxy middleware error:", err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/sign-in", "/w/:path*", "/workspace", "/onboarding", "/dashboard"],
};

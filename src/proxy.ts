import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedPaths = ["/dashboard", "/onboarding"];

export async function proxy(request: NextRequest) {
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
      new URL(hasOrganization ? "/dashboard" : "/onboarding", request.url),
    );
  }

  if (pathname.startsWith("/dashboard") && !hasOrganization) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (pathname.startsWith("/onboarding") && hasOrganization) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-in", "/dashboard", "/onboarding"],
};

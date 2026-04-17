import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const publicRoutes = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublic) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

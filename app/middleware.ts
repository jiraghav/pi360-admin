import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/login"];
const authRoutes = ["/dashboard", "/patients", "/facilities", "/emails", "/reports", "/settings", "/workspace"];

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const token = request.cookies.get("authToken")?.value;

    // Check if the route is public
    const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Check if the route requires authentication
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // If accessing auth route and not authenticated, redirect to login
    if (isAuthRoute && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // If accessing login and already authenticated, redirect to dashboard
    if (isPublicRoute && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};

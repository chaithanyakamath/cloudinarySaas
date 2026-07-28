import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/",
    "/home"
]); // Define public routes including catch-all auth routes

const isPublicApiRoute = createRouteMatcher([
    "/api/videos"
]); // Define public API routes that don't require authentication

export default clerkMiddleware((auth, req) => {
    const { userId } = auth(); // whether logged in or not
    const currentUrl = new URL(req.url);
    const isAccessingDashboard = currentUrl.pathname === "/home";
    const isApiRequest = currentUrl.pathname.startsWith("/api");

    // If user is logged in and accessing a public route but not the dashboard
    if (userId && isPublicRoute(req) && !isAccessingDashboard) {
        return NextResponse.redirect(new URL("/home", req.url)); // Redirect to home page
    }

    // Not logged in
    if (!userId) {
        // If user is not logged in and trying to access a protected route
        if (!isPublicRoute(req) && !isPublicApiRoute(req)) {
            return NextResponse.redirect(new URL("/sign-in", req.url)); // Redirect to sign-in page
        }

        // If the request is for a protected API and the user is not logged in
        if (isApiRequest && !isPublicApiRoute(req)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }
    return NextResponse.next(); // continue routing
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

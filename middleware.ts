import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import arcjet, { detectBot, shield, fixedWindow } from "@arcjet/next";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/forgot-password"
]);

// const aj = arcjet({
//   key: process.env.ARCJET_KEY!,
//   rules: [
//     detectBot({
//       mode: "LIVE",
//       allow: [
//         "CATEGORY:SEARCH_ENGINE",
//         "CATEGORY:MONITOR",
//         "CATEGORY:PREVIEW",
//       ],
//     }),
//     shield({ mode: "LIVE" }),
//     fixedWindow({
//       mode: "LIVE",
//       window: "1h",
//       max: 60,
//     }),
//   ],
// });

export default clerkMiddleware(async (auth, req) => {
  // 1. Arcjet protection
  // const decision = await aj.protect(req);
  // if (decision.isDenied()) {
  //   return NextResponse.json(
  //     { error: "Forbidden by Arcjet" },
  //     { status: 403 }
  //   );
  // }

  // 2. Clerk auth protection (only for non-public routes)
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // 3. Allow request
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

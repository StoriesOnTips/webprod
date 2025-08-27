"use client";

import * as React from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { FaGoogle } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [authStep, setAuthStep] = React.useState<
    "identifier" | "first_factor" | "second_factor" | "complete"
  >("identifier");
  const router = useRouter();

  // Get user's locale for CAPTCHA
  const [userLocale, setUserLocale] = React.useState("en-US");

  React.useEffect(() => {
    setMounted(true);
    
    // Get user's locale from browser or default to en-US
    const getLocale = () => {
      if (typeof navigator !== 'undefined' && navigator.language) {
        const locale = navigator.language;
        // Normalize to supported format (e.g., "es-ES", "en-US")
        const [lang, region] = locale.split('-');
        if (lang && region) {
          return `${lang}-${region.toUpperCase()}`;
        }
        return locale;
      }
      return "en-US";
    };
    
    setUserLocale(getLocale());
  }, []);

  // Handle the submission of the sign-in form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Start the sign-in process using the email and password provided
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      switch (signInAttempt.status) {
        case "complete": {
          setAuthStep("complete");
          await setActive({
            session: signInAttempt.createdSessionId,
            navigate: async ({ session }) => {
              if (session?.currentTask) {
                // Navigate to task resolution page based on task type
                // Note: SessionTask type checking removed as type property doesn't exist
                console.warn('Session has current task:', session.currentTask);
              }
              router.push("/");
            },
          });
          break;
        }
        case "needs_identifier": {
          setAuthStep("identifier");
          setFormError(
            "Please enter a valid email address to continue."
          );
          break;
        }
        case "needs_first_factor": {
          setAuthStep("first_factor");
          setFormError(
            "Please provide your password to continue."
          );
          break;
        }
        case "needs_second_factor": {
          setAuthStep("second_factor");
          setFormError(
            "Two-factor authentication required. Open your authenticator app or check your device for a verification code."
          );
          break;
        }
        default: {
          // Log structured error without exposing internal state details
          console.error("Sign-in attempt failed", {
            status: signInAttempt.status,
            factorStatuses: {
              first: !!signInAttempt.firstFactorVerification,
              second: !!signInAttempt.secondFactorVerification
            }
          });
          setFormError(
            "We couldn't complete the sign in. Please try again or use a different method."
          );
          break;
        }
      }
    } catch (err: any) {
      // Log only non-sensitive error information
      console.error("Sign-in error:", {
        message: err?.message,
        code: err?.code,
        status: err?.status,
        errors: err?.errors?.map((e: any) => ({ message: e.message, code: e.code }))
      });
      
      const friendlyMessage =
        err?.errors?.[0]?.message ||
        err?.message ||
        "Something went wrong while signing you in. Please try again.";
      setFormError(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth
  const signInWithGoogle = async () => {
    if (!isLoaded || isGoogleLoading) return;

    setIsGoogleLoading(true);

    try {
      await signIn?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error("Google OAuth error:", err);
      setFormError("Failed to connect with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  // Show loading skeleton if not loaded
  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2"></div>
                </div>
                <div className="grid gap-3">
                  <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                  <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                </div>
                <div className="grid gap-3">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
                </div>
                <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
              </div>
            </div>
            <div className="bg-muted relative hidden md:block">
              <div className="absolute inset-0 bg-muted animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your Acme Inc account
                </p>
              </div>
              {formError ? (
                <p className="text-sm text-red-600" role="alert">{formError}</p>
              ) : null}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isGoogleLoading}
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isGoogleLoading}
                  required
                />
                {authStep === "second_factor" ? (
                  <p className="text-xs text-muted-foreground">
                    Two-factor required: After entering your credentials, verify using your 2FA method.
                  </p>
                ) : null}
              </div>
              <div id="clerk-captcha" data-cl-size="flexible" />
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || isGoogleLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={signInWithGoogle}
                  disabled={isSubmitting || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting to Google...
                    </>
                  ) : (
                    <>
                      <FaGoogle className="mr-2" />
                      Login with Google
                    </>
                  )}
                  <span className="sr-only">Login with Google</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/auth/1.webp"
              alt="Authentication Sign In Image"
              className="absolute inset-0 h-full w-full object-cover"
              width={400}
              height={600}
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <Link
          href="/terms"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </Link>{" "}
        .
      </div>
    </div>
  );
}
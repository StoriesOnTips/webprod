"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { FaGoogle } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
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

  // Handle submission of the sign-up form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);



    try {
      // Start the sign-up process using the email and password provided
      await signUp.create({
        emailAddress,
        password,
      });

      // Send the user an email with the verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      // Set 'verifying' true to display second form
      // and capture the OTP code
      setVerifying(true);
    } catch (err: any) {
      // Log only non-sensitive error information
      console.error("Sign-up error:", {
        message: err?.message,
        code: err?.code,
        status: err?.status,
        errors: err?.errors?.map((e: any) => ({ message: e.message, code: e.code }))
      });
      
      const friendlyMessage =
        err?.errors?.[0]?.message ||
        err?.message ||
        "Something went wrong while creating your account. Please try again.";
      setFormError(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle the submission of the verification form
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({
          session: signUpAttempt.createdSessionId,
        });
        router.push('/');
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error("Sign-up verification incomplete")
        setFormError("Verification incomplete. Please try again or contact support.");
      }
    } catch (err: any) {
      console.error('Verification error:', {
        message: err?.message,
        code: err?.code,
        errors: err?.errors?.map((e: any) => ({ message: e.message, code: e.code }))
      });
      
      const friendlyMessage =
        err?.errors?.[0]?.message ||
        err?.message ||
        "Invalid verification code. Please try again.";
      setFormError(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth
  const signUpWithGoogle = async () => {
    if (!isLoaded || isGoogleLoading) return;

    setIsGoogleLoading(true);

    try {
      await signUp?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sign-up/sso-callback",
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

  // Display the verification form to capture the OTP code
  if (verifying) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form onSubmit={handleVerify} className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">Verify your email</h1>
                  <p className="text-muted-foreground text-balance">
                    We've sent a verification code to {emailAddress}
                  </p>
                </div>
                {formError ? (
                  <p className="text-sm text-red-600" role="alert">{formError}</p>
                ) : null}
                <div className="grid gap-3">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter your verification code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    disabled={isSubmitting}
                    required
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Check your email for a 6-digit verification code
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !code.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
                <div className="text-center text-sm">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    className="underline underline-offset-4 hover:text-primary"
                    onClick={async () => {
                      try {
                        await signUp?.prepareEmailAddressVerification({
                          strategy: 'email_code',
                        });
                        toast.success("Verification email sent");
                      } catch (err) {
                        console.error("Resend verification error:", err);
                        toast.error("Failed to resend verification");
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    Resend
                  </button>
                </div>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    className="underline underline-offset-4 hover:text-primary"
                    onClick={() => setVerifying(false)}
                    disabled={isSubmitting}
                  >
                    ← Back to sign up
                  </button>
                </div>
              </div>
            </form>
            <div className="bg-muted relative hidden md:block">
              <Image
                src="/auth/1.webp"
                alt="Authentication Sign Up Image"
                className="absolute inset-0 h-full w-full object-cover"
                width={400}
                height={600}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display the initial sign-up form to capture the email and password
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your details to get started with Acme Inc
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
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  disabled={isSubmitting || isGoogleLoading}
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isGoogleLoading}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
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
                    Creating account...
                  </>
                ) : (
                  "Create Account"
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
                  onClick={signUpWithGoogle}
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
                      Sign up with Google
                    </>
                  )}
                  <span className="sr-only">Sign up with Google</span>
                </Button>
              </div>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/auth/1.webp"
              alt="Authentication Sign Up Image"
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
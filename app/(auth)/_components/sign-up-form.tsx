"use client";

import * as React from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";

interface SignUpFormProps extends React.ComponentProps<"div"> {}

export default function SignUpForm({ className, ...props }: SignUpFormProps) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string>("");
  const [resendLoading, setResendLoading] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const router = useRouter();

  // Cooldown timer for resend
  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Resend verification code
  const resendVerification = async () => {
    if (!isLoaded || resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setError("");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setError("Verification code resent! Please check your email.");
      setResendCooldown(30); // 30s cooldown
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Handle sign-up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
      setError("");
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Sign-up error:", err);
      }
      setError(
        err.errors?.[0]?.message ||
          "Failed to create account. Please try again."
      );
    }
  };

  // Handle verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.push("/");
        setError("");
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error("Verification incomplete:", signUpAttempt.status);
        }
        setError(
          "Verification incomplete. Please check your code and try again."
        );
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Verification error:", err);
      }
      setError(
        err.errors?.[0]?.message || "Verification failed. Please try again."
      );
    }
  };

  // Google OAuth
  const signUpWithGoogle = () => {
    return signUp?.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sign-up/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            onSubmit={!verifying ? handleSubmit : handleVerify}
            className="p-6 md:p-8"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">
                  {verifying ? "Verify your email" : "Create an account"}
                </h1>
                <p className="text-muted-foreground text-balance">
                  {verifying
                    ? "We've sent a verification code to your email"
                    : "Enter your details to create your account"}
                </p>
              </div>
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!verifying ? (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="m@example.com"
                      required
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div
                    id="clerk-captcha"
                    data-cl-theme="dark"
                    data-cl-size="flexible"
                    data-cl-language="es-ES"
                  />
                  <Button type="submit" className="w-full">
                    Continue
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
                    >
                      <FaGoogle />
                      Sign up with Google
                      <span className="sr-only">Sign up with Google</span>
                    </Button>
                  </div>
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="underline underline-offset-4">
                      Sign in
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="code">Verification Code</Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter your code"
                      className="text-center tracking-widest"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Verify
                  </Button>
                  <div className="text-center text-sm">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={resendVerification}
                      className="underline underline-offset-4 hover:text-primary disabled:opacity-60"
                      disabled={resendLoading || resendCooldown > 0}
                    >
                      {resendLoading
                        ? "Resending..."
                        : resendCooldown > 0
                        ? `Try again (${resendCooldown})`
                        : "Try again"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/auth/2.webp"
              alt="Authentication Sign Up Image"
              className="absolute inset-0 h-full w-full object-cover"
              width={400}
              height={600}
            />
          </div>
        </CardContent>
      </Card>
      {!verifying && (
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
          </Link>
          .
        </div>
      )}
    </div>
  );
}

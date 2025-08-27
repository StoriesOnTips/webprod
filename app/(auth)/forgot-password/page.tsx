"use client";
import React, { useEffect, useState } from "react";
import { useAuth, useSignIn } from "@clerk/nextjs";
import type { NextPage } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ForgotPasswordPage: NextPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [secondFactor, setSecondFactor] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();

  useEffect(() => {
    if (isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return null;
  }

  // Send the password reset code to the user's email
  async function create(e: React.FormEvent) {
    e.preventDefault();
    
    if (!signIn) {
      setError("Unable to send reset code at this time");
      return;
    }
    
    const identifier = email.trim();
    if (!identifier) {
      setError("Please enter a valid email address");
      return;
    }
    
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier,
      });
      setSuccessfulCreation(true);
      setError("");
    } catch (err: any) {
      console.error("Password reset error:", err);
      
      // Centralize error parsing
      let message = "An unexpected error occurred.";
      if (err && typeof err === "object") {
        if (err.errors?.[0]?.longMessage) {
          message = err.errors[0].longMessage;
        } else if (err.errors?.[0]?.message) {
          message = err.errors[0].message;
        } else if (typeof err.message === "string") {
          message = err.message;
        }
      }
      
      setError(message);
    }
  }

  // Reset the user's password.
  // Upon successful reset, the user will be
  // signed in and redirected to the home page
  async function reset(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) {
      console.error("signIn is not available while attempting password reset");
      setError("Unable to reset password at this time");
      return;
    }
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });
      // Check if 2FA is required
      if (result.status === "needs_second_factor") {
        setSecondFactor(true);
        setError("");
      } else if (result.status === "complete") {
        // Set the active session to
        // the newly created session (user is now signed in)
        setActive({ session: result.createdSessionId });
        setError("");
      } else {
        console.log(result);
      }
    } catch (err: unknown) {
      console.error("Password reset error:", err);
      const message =
        (err as any)?.errors?.[0]?.longMessage ??
        (err as any)?.message ??
        String(err ?? "An unexpected error occurred.");
      setError(message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            onSubmit={!successfulCreation ? create : reset}
            className="p-6 md:p-8"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">
                  {!successfulCreation
                    ? "Forgot Password?"
                    : "Reset Your Password"}
                </h1>
                <p className="text-muted-foreground text-balance">
                  {!successfulCreation
                    ? "Enter your email address and we'll send you a reset code"
                    : "Enter the code we sent to your email and your new password"}
                </p>
              </div>

              {!successfulCreation && (
                <div className="grid gap-3">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              )}

              {successfulCreation && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="password">New password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="code">Reset code</Label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter the code from your email"
                      className="text-center tracking-widest"
                      required
                    />
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full">
                {!successfulCreation ? "Send reset code" : "Reset password"}
              </Button>

              {secondFactor && (
                <Alert>
                  <AlertDescription>
                    2FA is required, but this UI does not handle that
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center text-sm">
                Remember your password?{" "}
                <Link href="/sign-in" className="underline underline-offset-4">
                  Back to sign in
                </Link>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src={'/age-group/18+.webp'}
              alt="Authentication"
              height={400}
              width={400}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

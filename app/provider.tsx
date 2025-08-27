"use client";

import React, { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import {
  UserDetailContext,
  type UserDetail,
  type UserDetailContextType,
} from "./_context/UserDetailContext";
import {
  PayPalScriptProvider,
  type ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { createUser, fetchUser } from "@/lib/actions/user-actions";

interface ProviderProps {
  readonly children: ReactNode;
}

function Provider({ children }: ProviderProps) {
  const { user, isLoaded } = useUser();
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const initializeUser = useCallback(
    async (userEmail: string, userName: string, userImage: string) => {
      if (isLoading) return;

      setIsLoading(true);

      try {
        // First try to fetch existing user
        const fetchResult = await fetchUser(userEmail);

        if (fetchResult.success && fetchResult.data) {
          setUserDetail(fetchResult.data);
          setOnboardingCompleted(fetchResult.data.onboardingCompleted || false);
          setIsAuthReady(true);
        } else {
          const createResult = await createUser({
            userEmail,
            userName: userName || "Anonymous User",
            userImage: userImage || "",
          });

          if (createResult.success && createResult.data) {
            setUserDetail(createResult.data);
            setOnboardingCompleted(createResult.data.onboardingCompleted || false);
            setIsAuthReady(true);
          } else {
            throw new Error(createResult.message || "Failed to initialize user account");
          }
        }
      } catch (error) {
        console.error("Error initializing user:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        
        toast({
          title: "Failed to Load Account",
          description: `${errorMessage}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  useEffect(() => {
    if (!isLoaded || !user?.primaryEmailAddress?.emailAddress) {
      return;
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName;
    const userImage = user.imageUrl;

    initializeUser(userEmail, userName || "", userImage || "");
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress, user?.fullName, user?.imageUrl, initializeUser]);

  const refreshUser = useCallback(async () => {
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const userName = user?.fullName;
    const userImage = user?.imageUrl;

    if (!userEmail || isLoading) {
      return;
    }

    initializeUser(userEmail, userName || "", userImage || "");
  }, [user?.primaryEmailAddress?.emailAddress, user?.fullName, user?.imageUrl, isLoading, initializeUser]);

  useEffect(() => {
    if (isLoaded && !user) {
      setUserDetail(null);
      setIsAuthReady(false);
      setOnboardingCompleted(false);
    }
  }, [isLoaded, user]);

  // Compute redirect flags
  const shouldRedirectToOnboarding = useMemo(() => {
    return isAuthReady && !onboardingCompleted && userDetail !== null;
  }, [isAuthReady, onboardingCompleted, userDetail]);

  const shouldRedirectToDashboard = useMemo(() => {
    return isAuthReady && onboardingCompleted && userDetail !== null;
  }, [isAuthReady, onboardingCompleted, userDetail]);

  const paypalOptions: ReactPayPalScriptOptions | undefined = useMemo(() => {
    const rawClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!rawClientId) {
      console.warn("PayPal client ID not found in environment variables");
      return undefined;
    }

    const clientId = rawClientId.trim();
    const clientIdPattern = /^[a-zA-Z0-9_-]{10,128}$/;
    
    if (!clientIdPattern.test(clientId)) {
      console.warn("PayPal client ID validation failed");
      return undefined;
    }

    return {
      clientId,
      currency: "USD",
      intent: "capture",
      components: "buttons,marks",
      "disable-funding": "credit",
      debug: process.env.NODE_ENV === "development",
    };
  }, []);

  const contextValue: UserDetailContextType = useMemo(
    () => ({
      userDetail,
      setUserDetail,
      isLoading,
      refreshUser,
      isAuthReady,
      onboardingCompleted,
      shouldRedirectToOnboarding,
      shouldRedirectToDashboard,
    }),
    [userDetail, setUserDetail, isLoading, refreshUser, isAuthReady, onboardingCompleted, shouldRedirectToOnboarding, shouldRedirectToDashboard]
  );

  const PayPalWrapper = ({ children: paypalChildren }: { children: ReactNode }) => {
    if (!paypalOptions) {
      return <>{paypalChildren}</>;
    }

    return (
      <PayPalScriptProvider options={paypalOptions} deferLoading={false}>
        {paypalChildren}
      </PayPalScriptProvider>
    );
  };

  return (
    <UserDetailContext.Provider value={contextValue}>
      <PayPalWrapper>
        {children}
        <Toaster />
      </PayPalWrapper>
    </UserDetailContext.Provider>
  );
}

export default Provider;
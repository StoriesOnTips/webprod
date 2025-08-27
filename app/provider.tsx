"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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

type InitializationState = 'idle' | 'loading' | 'success' | 'error';

function Provider({ children }: ProviderProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Core state
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [initState, setInitState] = useState<InitializationState>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent duplicate operations
  const initializationRef = useRef<Promise<void> | null>(null);
  const hasInitialized = useRef(false);
  const hasRedirected = useRef(false);

  // Memoized PayPal options
  const paypalOptions: ReactPayPalScriptOptions | undefined = useMemo(() => {
    const rawClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!rawClientId) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("PayPal client ID not found in environment variables");
      }
      return undefined;
    }

    const clientId = rawClientId.trim();
    const clientIdPattern = /^[a-zA-Z0-9_-]{10,128}$/;
    
    if (!clientIdPattern.test(clientId)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("PayPal client ID validation failed");
      }
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

  // Single initialization function with proper error handling
  const initializeUser = useCallback(async (
    userEmail: string, 
    userName: string, 
    userImage: string
  ): Promise<void> => {
    // Prevent duplicate initialization
    if (initializationRef.current) {
      return initializationRef.current;
    }

    const initPromise = (async () => {
      setInitState('loading');
      setError(null);

      try {
        // First try to fetch existing user
        const fetchResult = await fetchUser(userEmail);

        if (fetchResult.success && fetchResult.data) {
          setUserDetail(fetchResult.data);
          setInitState('success');
          hasInitialized.current = true;
          return;
        }

        // Create new user if not found
        const createResult = await createUser({
          userEmail,
          userName: userName || "Anonymous User",
          userImage: userImage || "",
        });

        if (createResult.success && createResult.data) {
          setUserDetail(createResult.data);
          setInitState('success');
          hasInitialized.current = true;
        } else {
          throw new Error(createResult.message || "Failed to initialize user account");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        console.error("User initialization failed:", errorMessage);
        
        setError(errorMessage);
        setInitState('error');
        
        toast({
          title: "Failed to Load Account",
          description: `${errorMessage}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        initializationRef.current = null;
      }
    })();

    initializationRef.current = initPromise;
    return initPromise;
  }, []);

  // Initialize user when Clerk user loads
  useEffect(() => {
    if (!isLoaded || !user?.primaryEmailAddress?.emailAddress || hasInitialized.current) {
      return;
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.fullName || "";
    const userImage = user.imageUrl || "";

    initializeUser(userEmail, userName, userImage);
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress, user?.fullName, user?.imageUrl, initializeUser]);

  // Handle user logout
  useEffect(() => {
    if (isLoaded && !user && hasInitialized.current) {
      // Reset all state on logout
      setUserDetail(null);
      setInitState('idle');
      setError(null);
      hasInitialized.current = false;
      hasRedirected.current = false;
      initializationRef.current = null;
    }
  }, [isLoaded, user]);

  // Handle routing - only runs once per session
  useEffect(() => {
    if (
      initState !== 'success' || 
      !userDetail || 
      hasRedirected.current
    ) {
      return;
    }

    const currentPath = window.location.pathname;
    const isOnboardingComplete = userDetail.onboardingCompleted;

    // Prevent redirect loops
    if (
      (!isOnboardingComplete && currentPath.startsWith('/onboarding')) ||
      (isOnboardingComplete && currentPath === '/dashboard')
    ) {
      return;
    }

    hasRedirected.current = true;

    if (!isOnboardingComplete) {
      router.push('/onboarding');
    } else if (currentPath === '/' || currentPath.startsWith('/onboarding')) {
      router.push('/dashboard');
    }
  }, [initState, userDetail, router]);

  // Refresh user function for manual updates
  const refreshUser = useCallback(async () => {
    const userEmail = user?.primaryEmailAddress?.emailAddress;
    const userName = user?.fullName || "";
    const userImage = user?.imageUrl || "";

    if (!userEmail || initState === 'loading') {
      return;
    }

    // Reset initialization state for refresh
    hasInitialized.current = false;
    initializationRef.current = null;
    
    await initializeUser(userEmail, userName, userImage);
  }, [user, initState, initializeUser]);

  // Toast functions
  const showSuccessToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, []);

  const showErrorToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  }, []);

  const showInfoToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, []);

  const showWarningToast = useCallback((title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  }, []);

  // Context value - only recompute when necessary
  const contextValue: UserDetailContextType = useMemo(() => ({
    userDetail,
    setUserDetail,
    isLoading: initState === 'loading',
    refreshUser,
    error,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
  }), [
    userDetail,
    initState,
    refreshUser,
    error,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
  ]);

  // PayPal wrapper component
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
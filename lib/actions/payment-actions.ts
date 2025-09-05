// lib/actions/payment-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { Users, PaymentTransaction, PaymentAuditLog } from "@/config/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { polar, CREDIT_PACKAGES, type PackageId } from "@/lib/polar";

interface PaymentResult {
  success: boolean;
  message: string;
  newBalance?: number;
  error?: string;
}

/**
 * Create Polar checkout and redirect - Production Ready
 */
export async function createPolarCheckout(packageId: number): Promise<never> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('Authentication required');
    }

    const pkg = CREDIT_PACKAGES[packageId as PackageId];
    if (!pkg) {
      throw new Error('Invalid package selected');
    }

    // Get user details from database
    const [user] = await db
      .select({ 
        userEmail: Users.userEmail,
        userName: Users.userName 
      })
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found in database');
    }

    // Validate email format
    if (!user.userEmail || !user.userEmail.includes('@')) {
      throw new Error('Invalid user email');
    }

    // Create Polar checkout using correct API
    const checkout = await polar.checkouts.create({
      customerBillingAddress: {
        country: "US",
      },
      products: [pkg.productId],
      successUrl: `${process.env.NEXT_PUBLIC_URL}/buy-coins/success?session_id={CHECKOUT_ID}`,
      customerEmail: user.userEmail,
      metadata: {
        userId: userId,
        packageId: packageId.toString(),
        credits: pkg.credits.toString(),
        packageName: pkg.name,
        userEmail: user.userEmail,
        source: 'storiesontips'
      }
    });

    if (!checkout.url) {
      throw new Error('Checkout URL not returned from Polar');
    }

    // Log successful checkout creation
    console.log(`Polar checkout created for user ${userId}: ${checkout.id}`);

    // This will throw NEXT_REDIRECT - it's expected behavior!
    redirect(checkout.url);

  } catch (error) {
    // Check if it's the expected Next.js redirect
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      // Re-throw to let Next.js handle the redirect
      throw error;
    }

    console.error("Polar checkout creation failed:", {
      error: error instanceof Error ? error.message : error,
      packageId,
      timestamp: new Date().toISOString()
    });
    
    // Throw with user-friendly message
    if (error instanceof Error && error.message.includes('Authentication')) {
      throw new Error('Please sign in to continue with your purchase');
    } else if (error instanceof Error && error.message.includes('Invalid package')) {
      throw new Error('Selected package is no longer available');
    } else if (error instanceof Error && error.message.includes('User not found')) {
      throw new Error('Account not found. Please refresh and try again');
    } else {
      throw new Error('Unable to create checkout. Please try again or contact support');
    }
  }
}

/**
 * Add credits to user (called by webhook) - Production Ready Sequential Operations
 */
export async function addCreditsToUser(
  userId: string, 
  credits: number, 
  orderId: string,
  packageId: number
): Promise<PaymentResult> {
  try {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.length < 1) {
      throw new Error('Invalid user ID provided');
    }
    
    if (!credits || credits <= 0 || !Number.isInteger(credits) || credits > 100) {
      throw new Error('Invalid credits amount provided');
    }
    
    if (!orderId || typeof orderId !== 'string' || orderId.length < 1) {
      throw new Error('Invalid order ID provided');
    }

    if (![1, 2, 3, 4].includes(packageId)) {
      throw new Error('Invalid package ID provided');
    }

    const pkg = CREDIT_PACKAGES[packageId as PackageId];
    if (!pkg) {
      throw new Error('Package configuration not found');
    }

    console.log(`Processing credit addition: ${credits} coins for user ${userId}, order ${orderId}`);

    // Step 1: Check for duplicate orders FIRST
    const existingPayment = await db
      .select({ 
        id: PaymentTransaction.id,
        status: PaymentTransaction.status 
      })
      .from(PaymentTransaction)
      .where(eq(PaymentTransaction.orderId, orderId))
      .limit(1);

    if (existingPayment.length > 0) {
      console.log(`Duplicate order detected: ${orderId} already processed`);
      return {
        success: false,
        message: "Payment already processed",
        error: "Duplicate order prevention"
      };
    }

    // Step 2: Verify user exists and get current balance
    const [currentUser] = await db
      .select({ 
        clerkUserId: Users.clerkUserId,
        credits: Users.credits,
        userEmail: Users.userEmail
      })
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .limit(1);

    if (!currentUser) {
      throw new Error("User not found in database");
    }

    console.log(`User found: ${currentUser.userEmail}, current balance: ${currentUser.credits}`);

    // Step 3: Create payment record FIRST (for audit trail)
    const [paymentRecord] = await db
      .insert(PaymentTransaction)
      .values({
        userId,
        orderId: orderId,
        captureId: orderId,
        amount: pkg.price.toString(),
        currency: "USD",
        status: "COMPLETED",
        rawPayload: {
          packageId,
          packageName: pkg.name,
          credits: credits,
          processedAt: new Date().toISOString(),
          source: 'polar',
          priceVerified: pkg.price,
          userEmailAtTime: currentUser.userEmail,
          previousBalance: currentUser.credits
        },
        verifiedAt: new Date(),
      })
      .returning({ 
        id: PaymentTransaction.id,
        orderId: PaymentTransaction.orderId 
      });

    console.log(`Payment record created: ${paymentRecord.id} for order ${paymentRecord.orderId}`);

    // Step 4: Update user credits
    const [updatedUser] = await db
      .update(Users)
      .set({
        credits: sql`${Users.credits} + ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(Users.clerkUserId, userId))
      .returning({ 
        credits: Users.credits,
        clerkUserId: Users.clerkUserId
      });

    if (!updatedUser) {
      // If user update failed, we need to log this critical error
      console.error(`CRITICAL: User credit update failed for user ${userId}, payment record ${paymentRecord.id} exists but credits not added`);
      
      // Try to mark payment as failed
      await db
        .update(PaymentTransaction)
        .set({ 
          status: "FAILED",
          rawPayload: sql`${PaymentTransaction.rawPayload} || ${{ 
            errorReason: "User credit update failed",
            failedAt: new Date().toISOString()
          }}`
        })
        .where(eq(PaymentTransaction.id, paymentRecord.id));

      throw new Error("Failed to update user credits - payment record created but credits not added");
    }

    console.log(`User credits updated: ${currentUser.credits} -> ${updatedUser.credits} (+${credits})`);

    // Step 5: Create audit log
    await db
      .insert(PaymentAuditLog)
      .values({
        transactionId: paymentRecord.id,
        newStatus: "COMPLETED",
        changedBy: "polar_webhook",
        reason: `Polar payment processed successfully - Added ${credits} coins to user account (Package: ${pkg.name}). Balance: ${currentUser.credits} -> ${updatedUser.credits}`,
      });

    console.log(`Audit log created for transaction ${paymentRecord.id}`);

    // Step 6: Revalidate pages to update UI
    revalidatePath("/dashboard");
    revalidatePath("/buy-coins");

    console.log(`SUCCESS: Credits added successfully for user ${userId}. New balance: ${updatedUser.credits}`);

    return {
      success: true,
      message: `Successfully added ${credits} coins to your account!`,
      newBalance: updatedUser.credits
    };

  } catch (error) {
    console.error("CRITICAL ERROR in addCreditsToUser:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      userId,
      credits,
      orderId,
      packageId,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add coins to account",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Manual credit recovery function (in case of webhook failures)
 */
export async function recoverMissingCredits(orderId: string): Promise<PaymentResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, message: "Authentication required" };
    }

    // Find the payment record
    const [payment] = await db
      .select({
        id: PaymentTransaction.id,
        userId: PaymentTransaction.userId,
        rawPayload: PaymentTransaction.rawPayload,
        status: PaymentTransaction.status
      })
      .from(PaymentTransaction)
      .where(eq(PaymentTransaction.orderId, orderId))
      .limit(1);

    if (!payment) {
      return { success: false, message: "Payment record not found" };
    }

    if (payment.userId !== userId) {
      return { success: false, message: "Payment does not belong to this user" };
    }

    const payload = payment.rawPayload as any;
    const credits = payload.credits;
    const previousBalance = payload.previousBalance || 0;

    // Check current user balance
    const [currentUser] = await db
      .select({ credits: Users.credits })
      .from(Users)
      .where(eq(Users.clerkUserId, userId))
      .limit(1);

    if (!currentUser) {
      return { success: false, message: "User not found" };
    }

    // If user already has the credits, no recovery needed
    if (currentUser.credits >= previousBalance + credits) {
      return { 
        success: true, 
        message: "Credits already applied - no recovery needed",
        newBalance: currentUser.credits
      };
    }

    // Add missing credits
    const [updatedUser] = await db
      .update(Users)
      .set({
        credits: sql`${Users.credits} + ${credits}`,
        updatedAt: new Date(),
      })
      .where(eq(Users.clerkUserId, userId))
      .returning({ credits: Users.credits });

    // Log recovery
    await db
      .insert(PaymentAuditLog)
      .values({
        transactionId: payment.id,
        newStatus: "RECOVERED",
        changedBy: "manual_recovery",
        reason: `Manual credit recovery - Added ${credits} missing coins`,
      });

    revalidatePath("/dashboard");
    revalidatePath("/buy-coins");

    return {
      success: true,
      message: `Recovered ${credits} missing coins!`,
      newBalance: updatedUser?.credits
    };

  } catch (error) {
    console.error("Credit recovery failed:", error);
    return {
      success: false,
      message: "Credit recovery failed"
    };
  }
}

/**
 * Get user's payment history - Production Ready
 */
export async function getUserPaymentHistory(): Promise<{
  success: boolean;
  transactions?: any[];
  message: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, message: "Authentication required" };
    }

    const transactions = await db
      .select({
        id: PaymentTransaction.id,
        orderId: PaymentTransaction.orderId,
        amount: PaymentTransaction.amount,
        currency: PaymentTransaction.currency,
        status: PaymentTransaction.status,
        rawPayload: PaymentTransaction.rawPayload,
        verifiedAt: PaymentTransaction.verifiedAt,
        createdAt: PaymentTransaction.createdAt,
      })
      .from(PaymentTransaction)
      .where(eq(PaymentTransaction.userId, userId))
      .orderBy(sql`${PaymentTransaction.createdAt} DESC`)
      .limit(50);

    return {
      success: true,
      transactions,
      message: "Payment history retrieved successfully"
    };

  } catch (error) {
    console.error("Error getting payment history:", error);
    return {
      success: false,
      message: "Failed to retrieve payment history"
    };
  }
}

/**
 * Verify webhook signature - Dev Version (Simple)
 */
export async function verifyPolarWebhookSignature(
  body: string, 
  signature: string | null, 
  secret: string
): Promise<boolean> {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Simple comparison for development
    return signature === secret;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
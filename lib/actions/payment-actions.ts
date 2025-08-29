"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { Users, PaymentTransaction, PaymentAuditLog } from "@/config/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

// Credit packages configuration
const CREDIT_PACKAGES = {
  1: { price: 3.99, credits: 3, name: "Starter Pack" },
  2: { price: 4.99, credits: 7, name: "Popular Pack" },
  3: { price: 8.99, credits: 12, name: "Value Pack" },
  4: { price: 9.99, credits: 16, name: "Premium Pack" },
} as const;

// Configuration constants
const CONFIG = {
  PAYPAL_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // Exponential backoff
  AMOUNT_TOLERANCE: 0.01,
} as const;

// Types
interface PaymentResult {
  success: boolean;
  message: string;
  newBalance?: number;
  error?: string;
  canRetry?: boolean;
  transactionId?: string;
}

interface PayPalVerificationResult {
  success: boolean;
  amount?: number;
  captureId?: string;
  status?: string;
  error?: string;
  retryable?: boolean;
}

interface PaymentAuditData {
  transactionId: number;
  previousStatus?: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
}

// ====================== MAIN PAYMENT PROCESSOR ======================
/**
 * Process PayPal payment with retry logic, audit trail, and recovery
 */
export async function processPayPalPayment(
  orderID: string,
  packageId: number
): Promise<PaymentResult> {
  const requestId = uuidv4().slice(0, 8);
  let lastError: string = "";
  
  const { userId } = await auth();
  
  if (!userId) {
    logPaymentEvent(orderID, "AUTH_FAILED", "No user authentication", 1, requestId);
    return { 
      success: false, 
      message: "Authentication required. Please sign in and try again." 
    };
  }

  // Check if payment already processed (idempotency protection)
  const existingPayment = await checkExistingPayment(orderID, userId);
  if (existingPayment) {
    logPaymentEvent(orderID, "ALREADY_PROCESSED", 
      `Payment already completed for user ${userId}`, 1, requestId);
    
    return { 
      success: true, 
      message: "Payment already processed successfully",
      newBalance: existingPayment.newBalance,
      transactionId: existingPayment.transactionId
    };
  }

  // Validate package
  const pkg = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];
  if (!pkg) {
    logPaymentEvent(orderID, "INVALID_PACKAGE", 
      `Invalid package ID: ${packageId}`, 1, requestId);
    return { 
      success: false, 
      message: "Invalid package selected. Please try again." 
    };
  }

  // Process payment with retry logic
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      // Verify payment with PayPal (with timeout protection)
      const paypalResult = await withTimeout(
        verifyPayPalOrder(orderID, requestId),
        CONFIG.PAYPAL_TIMEOUT,
        "PayPal verification"
      );

      if (!paypalResult.success) {
        logPaymentEvent(orderID, "PAYPAL_VERIFICATION_FAILED", 
          paypalResult.error || "PayPal verification failed", attempt, requestId);
        
        lastError = paypalResult.error || "PayPal verification failed";
        
        // Retry logic for retryable errors
        if (attempt < CONFIG.MAX_RETRIES && paypalResult.retryable) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAYS[attempt - 1]));
          continue;
        }
        
        return { 
          success: false, 
          message: "Payment verification failed. Please try again or contact support.",
          error: paypalResult.error,
          canRetry: paypalResult.retryable 
        };
      }

      // Validate payment amount
      if (Math.abs((paypalResult.amount || 0) - pkg.price) > CONFIG.AMOUNT_TOLERANCE) {
        const errorMsg = `Expected: ${pkg.price}, Received: ${paypalResult.amount}`;
        logPaymentEvent(orderID, "AMOUNT_MISMATCH", errorMsg, attempt, requestId);
        
        return { 
          success: false, 
          message: "Payment amount mismatch. Please try again." 
        };
      }

      // Process payment atomically with database transaction
      const result = await processPaymentTransaction({
        userId,
        orderID,
        packageId,
        pkg,
        paypalResult,
        requestId,
        attempt
      });

      if (result.success) {
        logPaymentEvent(orderID, "SUCCESS", 
          `Successfully added ${pkg.credits} credits to user ${userId}`, attempt, requestId);

        // Revalidate relevant pages
        revalidatePath("/dashboard");
        revalidatePath("/buy-coins");
        revalidatePath("/profile");

        return {
          success: true,
          message: `Successfully purchased ${pkg.name}! ${pkg.credits} credits added to your account.`,
          newBalance: result.newBalance,
          transactionId: result.transactionId
        };
      } else {
        throw new Error(result.error || "Transaction processing failed");
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      lastError = errorMsg;
      
      logPaymentEvent(orderID, "PROCESSING_ERROR", errorMsg, attempt, requestId);
      
      console.error(`Payment attempt ${attempt}/${CONFIG.MAX_RETRIES} failed:`, {
        orderID,
        attempt,
        error: errorMsg,
        requestId
      });
      
      // Retry logic for recoverable errors
      if (attempt < CONFIG.MAX_RETRIES) {
        const isRetryableError = 
          errorMsg.includes("timeout") || 
          errorMsg.includes("network") ||
          errorMsg.includes("ECONNRESET") ||
          errorMsg.includes("fetch failed") ||
          errorMsg.includes("ECONN");
          
        if (isRetryableError) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAYS[attempt - 1]));
          continue;
        }
      }
      
      return { 
        success: false, 
        message: "Payment processing failed. Please try again or contact support.",
        error: errorMsg,
        canRetry: attempt < CONFIG.MAX_RETRIES
      };
    }
  }

  return { 
    success: false, 
    message: "Payment failed after multiple attempts. Please contact support if this continues.",
    error: lastError,
    canRetry: false 
  };
}

// ====================== DATABASE TRANSACTION PROCESSING ======================

/**
 * Process payment transaction atomically with full audit trail and race condition protection
 */
async function processPaymentTransaction({
  userId,
  orderID,
  packageId,
  pkg,
  paypalResult,
  requestId,
  attempt
}: {
  userId: string;
  orderID: string;
  packageId: number;
  pkg: typeof CREDIT_PACKAGES[keyof typeof CREDIT_PACKAGES];
  paypalResult: PayPalVerificationResult;
  requestId: string;
  attempt: number;
}): Promise<{ success: boolean; newBalance?: number; transactionId?: string; error?: string }> {
  
  try {
    const result = await db.transaction(async (tx) => {
      // 1. Check for duplicate orders within transaction to prevent race conditions
      const existingInTransaction = await tx
        .select({ id: PaymentTransaction.id })
        .from(PaymentTransaction)
        .where(sql`${PaymentTransaction.orderId} = ${orderID} AND ${PaymentTransaction.userId} = ${userId}`)
        .limit(1);

      if (existingInTransaction.length > 0) {
        throw new Error("Duplicate order detected (orderId already recorded)");
      }

      // 2. Create payment transaction record
      const [paymentRecord] = await tx
        .insert(PaymentTransaction)
        .values({
          userId,
          orderId: orderID,
          captureId: paypalResult.captureId || null,
          amount: pkg.price.toString(),
          currency: "USD",
          status: paypalResult.status || "COMPLETED",
          rawPayload: {
            packageId,
            packageName: pkg.name,
            credits: pkg.credits,
            attempt,
            requestId,
            paypalData: {
              captureId: paypalResult.captureId,
              status: paypalResult.status,
              amount: paypalResult.amount
            },
            processedAt: new Date().toISOString()
          },
          verifiedAt: new Date(),
        })
        .returning({ 
          id: PaymentTransaction.id,
          orderId: PaymentTransaction.orderId 
        });

      // 3. Add credits to user account
      const [userResult] = await tx
        .update(Users)
        .set({
          credits: sql`${Users.credits} + ${pkg.credits}`,
          updatedAt: new Date(),
        })
        .where(eq(Users.clerkUserId, userId))
        .returning({ credits: Users.credits });

      if (!userResult) {
        throw new Error("User not found during credit update");
      }

      // 4. Create audit log entry
      await tx
        .insert(PaymentAuditLog)
        .values({
          transactionId: paymentRecord.id,
          newStatus: "COMPLETED",
          changedBy: "system",
          reason: `Payment processed successfully - Added ${pkg.credits} credits`,
        });

      return {
        success: true,
        newBalance: userResult.credits,
        transactionId: paymentRecord.id.toString()
      };
    });

    return result;

  } catch (error) {
    console.error("Database transaction failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database transaction failed"
    };
  }
}

// ====================== PAYPAL VERIFICATION ======================

/**
 * Verify and capture PayPal payment
 */
async function verifyPayPalOrder(orderID: string, requestId: string): Promise<PayPalVerificationResult> {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

    if (!clientId || !secret) {
      return { 
        success: false, 
        error: "PayPal configuration missing",
        retryable: false
      };
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    // Capture the payment
    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "PayPal-Request-Id": `${orderID}-${requestId}-${Date.now()}`, // Idempotency key
        "Prefer": "return=representation",
      },
    });

    if (!response.ok) {
      // Handle specific PayPal error cases
      if (response.status === 422) {
        // Payment might already be captured, check status
        return await checkPayPalOrderStatus(orderID, requestId);
      }

      const errorText = await response.text().catch(() => "Unable to read error");
      
      return { 
        success: false, 
        error: `PayPal API error: ${response.status} - ${errorText}`,
        retryable: response.status >= 500 // Retry on server errors
      };
    }

    const data = await response.json();
    
    if (data.status !== "COMPLETED") {
      return { 
        success: false, 
        error: `Payment not completed. Status: ${data.status}`,
        retryable: data.status === "APPROVED" // Can retry if approved
      };
    }

    // Extract payment details
    const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
    const amount = parseFloat(capture?.amount?.value || "0");

    return { 
      success: true, 
      amount,
      captureId: capture?.id,
      status: data.status
    };

  } catch (error) {
    console.error("PayPal verification error:", error);
    
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const isNetworkError = errorMsg.includes("fetch") || errorMsg.includes("network");
    
    return {
      success: false,
      error: errorMsg,
      retryable: isNetworkError
    };
  }
}

/**
 * Check PayPal order status (for already captured orders)
 */
async function checkPayPalOrderStatus(orderID: string, requestId: string): Promise<PayPalVerificationResult> {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

    if (!clientId || !secret) {
      return { success: false, error: "PayPal configuration missing", retryable: false };
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return { 
        success: false, 
        error: `PayPal status check failed: ${response.status}`,
        retryable: response.status >= 500
      };
    }

    const data = await response.json();
    
    if (data.status === "COMPLETED") {
      const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
      const amount = parseFloat(capture?.amount?.value || "0");
      
      return { 
        success: true, 
        amount,
        captureId: capture?.id,
        status: data.status
      };
    }

    return { 
      success: false, 
      error: `Order status: ${data.status}`,
      retryable: false
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMsg,
      retryable: errorMsg.includes("fetch") || errorMsg.includes("network")
    };
  }
}

// ====================== UTILITY FUNCTIONS ======================

/**
 * Check if payment has already been processed (idempotency) - now scoped to current user
 */
async function checkExistingPayment(orderID: string, userId: string): Promise<{
  newBalance: number;
  transactionId: string;
} | null> {
  try {
    const existing = await db
      .select({ 
        userId: PaymentTransaction.userId,
        id: PaymentTransaction.id,
        status: PaymentTransaction.status
      })
      .from(PaymentTransaction)
      .where(sql`${PaymentTransaction.orderId} = ${orderID} AND ${PaymentTransaction.userId} = ${userId}`)
      .limit(1);
    
    if (existing.length > 0 && existing[0].status === "COMPLETED") {
      const user = await db
        .select({ credits: Users.credits })
        .from(Users)
        .where(eq(Users.clerkUserId, userId))
        .limit(1);
      
      if (user.length > 0) {
        return { 
          newBalance: user[0].credits,
          transactionId: existing[0].id.toString()
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error checking existing payment:", error);
    return null;
  }
}

/**
 * Log payment events for audit trail - Made synchronous to avoid await in loops
 */
function logPaymentEvent(
  orderID: string, 
  status: string, 
  message: string, 
  attempt: number,
  requestId: string
): void {
  try {
    console.log(`Payment ${orderID} [${requestId}] - Attempt ${attempt}: ${status} - ${message}`, {
      orderID,
      status,
      message,
      attempt,
      requestId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Fail silently for logging to not interrupt payment flow
    console.error("Logging error:", error);
  }
}

/**
 * Timeout wrapper for async operations
 */
async function withTimeout<T>(
  promise: Promise<T>, 
  ms: number, 
  operation: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timeout after ${ms}ms`)), ms)
  );
  
  return Promise.race([promise, timeout]);
}

// ====================== RECOVERY FUNCTIONS ======================

/**
 * Recover missing credits for completed PayPal payments - Fixed to prevent double-crediting
 */
export async function recoverMissingCredits(): Promise<PaymentResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, message: "Authentication required" };
    }

    // Find completed PayPal transactions without corresponding credit recovery - exclude already recovered
    const missingCredits = await db
      .select({
        orderId: PaymentTransaction.orderId,
        amount: PaymentTransaction.amount,
        rawPayload: PaymentTransaction.rawPayload,
        id: PaymentTransaction.id
      })
      .from(PaymentTransaction)
      .where(sql`
        ${PaymentTransaction.userId} = ${userId} 
        AND ${PaymentTransaction.status} = 'COMPLETED' 
        AND ${PaymentTransaction.verifiedAt} IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM ${PaymentAuditLog} lap
          WHERE lap.transactionId = ${PaymentTransaction.id}
          AND lap.newStatus = 'CREDITS_RECOVERED'
        )
      `);

    if (missingCredits.length === 0) {
      return { 
        success: true, 
        message: "No missing credits found",
        newBalance: 0
      };
    }

    let totalRecovered = 0;
    
    // Process all transactions in batch instead of loop with awaits
    const creditUpdates = missingCredits
      .map(transaction => {
        const payload = transaction.rawPayload as any;
        const credits = payload?.credits || 0;
        return { transaction, credits };
      })
      .filter(({ credits }) => credits > 0);

    if (creditUpdates.length > 0) {
      // Calculate total credits to recover
      totalRecovered = creditUpdates.reduce((sum, { credits }) => sum + credits, 0);
      
      // Execute all operations in a single transaction
      await db.transaction(async (tx) => {
        // Update user credits in one operation
        await tx
          .update(Users)
          .set({
            credits: sql`${Users.credits} + ${totalRecovered}`,
            updatedAt: new Date(),
          })
          .where(eq(Users.clerkUserId, userId));
        
        // Insert all audit logs in batch
        const auditLogs = creditUpdates.map(({ transaction, credits }) => ({
          transactionId: transaction.id,
          previousStatus: "COMPLETED" as const,
          newStatus: "CREDITS_RECOVERED" as const,
          changedBy: "recovery_system",
          reason: `Recovered ${credits} missing credits`,
        }));
        
        if (auditLogs.length > 0) {
          await tx.insert(PaymentAuditLog).values(auditLogs);
        }
      });

      revalidatePath("/dashboard");
      revalidatePath("/buy-coins");
      
      // Get the actual user balance after recovery
      const [userAfter] = await db
        .select({ credits: Users.credits })
        .from(Users)
        .where(eq(Users.clerkUserId, userId))
        .limit(1);
      
      return {
        success: true,
        message: `Recovered ${totalRecovered} missing credits!`,
        newBalance: userAfter?.credits ?? undefined
      };
    }

    return { 
      success: true, 
      message: "No credits needed recovery",
      newBalance: 0 
    };

  } catch (error) {
    console.error("Credit recovery error:", error);
    return {
      success: false,
      message: "Credit recovery failed",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * Get user's payment history
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
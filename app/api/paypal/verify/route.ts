import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { 
  upsertPaymentTransaction, 
  createPaymentAuditLog, 
  updatePaymentTransactionStatus 
} from "@/lib/actions/payment-actions";

// Input validation schema
const PayPalVerifySchema = z.object({
  orderID: z
    .string()
    .min(1, "Order ID is required")
    .max(100, "Order ID too long"),
});

// PayPal API response types
interface PayPalCaptureResponse {
  id: string;
  status: string;
  purchase_units?: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
  links?: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

// API Response types
interface PayPalVerifyResponse {
  success: boolean;
  message: string;
  orderID?: string;
  errors?: any[];
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<PayPalVerifyResponse>> {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - Please sign in to verify payment",
        },
        { status: 401 }
      );
    }

    // Validate environment variables
    const paypalClientId = process.env.PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_SECRET;
    const paypalBaseUrl = process.env.PAYPAL_BASE_URL;

    if (!paypalClientId || !paypalSecret || !paypalBaseUrl) {
      console.error("Missing PayPal configuration:", {
        hasClientId: !!paypalClientId,
        hasSecret: !!paypalSecret,
        hasBaseUrl: !!paypalBaseUrl,
      });
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment service is temporarily unavailable. Please contact support.",
        },
        { status: 500 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    const validationResult = PayPalVerifySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { orderID } = validationResult.data;

    // Create PayPal Authorization header
    const authHeader = `Basic ${Buffer.from(
      `${paypalClientId}:${paypalSecret}`
    ).toString("base64")}`;

    // Set up request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let paypalResponse: Response;

    try {
      // Make request to PayPal API to capture payment
      paypalResponse = await fetch(
        `${paypalBaseUrl}/v2/checkout/orders/${orderID}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            Accept: "application/json",
            "PayPal-Request-Id": `${userId}-${orderID}-${Date.now()}`, // Idempotency key
            Prefer: "return=representation", // Get full response details
          },
          signal: controller.signal,
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);

      // Persist network error
      try {
        const errorStatus = fetchError instanceof Error && fetchError.name === "AbortError" 
          ? "TIMEOUT_ERROR" 
          : "NETWORK_ERROR";
        
        const transactionResult = await upsertPaymentTransaction({
          userId,
          orderId: orderID,
          captureId: undefined,
          amount: "0",
          currency: "USD",
          status: errorStatus,
          rawPayload: {
            error: {
              type: fetchError instanceof Error ? fetchError.name : "Unknown",
              message: fetchError instanceof Error ? fetchError.message : "Network error",
            },
            orderID,
            userId,
            timestamp: new Date().toISOString(),
          },
        });

        if (transactionResult.success && transactionResult.transactionId) {
          await createPaymentAuditLog({
            transactionId: transactionResult.transactionId,
            newStatus: errorStatus,
            changedBy: "system",
            reason: fetchError instanceof Error && fetchError.name === "AbortError" 
              ? "PayPal API timeout" 
              : "PayPal API network error",
          });
        }
      } catch (dbError) {
        console.error("Database error during network error persistence:", dbError);
      }

      if (fetchError instanceof Error) {
        if (fetchError.name === "AbortError") {
          console.error("PayPal API timeout:", { orderID, userId });
          return NextResponse.json(
            {
              success: false,
              message:
                "Payment verification timed out. Please try again or contact support if the issue persists.",
            },
            { status: 408 }
          );
        }
      }

      console.error("PayPal API network error:", fetchError);
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to connect to payment service. Please check your internet connection and try again.",
        },
        { status: 503 }
      );
    }

    clearTimeout(timeoutId);

    // Handle non-2xx HTTP responses
    if (!paypalResponse.ok) {
      let errorDetails;
      try {
        errorDetails = await paypalResponse.text();
      } catch {
        errorDetails = "Unable to read error response";
      }

      console.error(`PayPal API HTTP error:`, {
        status: paypalResponse.status,
        statusText: paypalResponse.statusText,
        orderID,
        userId,
        errorDetails,
        timestamp: new Date().toISOString(),
      });

      // Persist failed verification attempt
      try {
        const transactionResult = await upsertPaymentTransaction({
          userId,
          orderId: orderID,
          captureId: undefined,
          amount: "0",
          currency: "USD",
          status: `HTTP_ERROR_${paypalResponse.status}`,
          rawPayload: {
            error: {
              status: paypalResponse.status,
              statusText: paypalResponse.statusText,
              details: errorDetails,
            },
            orderID,
            userId,
            timestamp: new Date().toISOString(),
          },
        });

        if (transactionResult.success && transactionResult.transactionId) {
          await createPaymentAuditLog({
            transactionId: transactionResult.transactionId,
            newStatus: `HTTP_ERROR_${paypalResponse.status}`,
            changedBy: "system",
            reason: `PayPal API HTTP error: ${paypalResponse.status} - ${paypalResponse.statusText}`,
          });
        }
      } catch (dbError) {
        console.error("Database error during error persistence:", dbError);
      }

      // Handle specific PayPal error codes
      if (paypalResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment order not found. Please start a new payment process.",
          },
          { status: 400 }
        );
      }

      if (paypalResponse.status === 422) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payment cannot be processed. The order may have already been captured or canceled.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment verification failed. Please contact support if this issue persists.",
        },
        { status: 400 }
      );
    }

    // Parse PayPal response
    let paypalData: PayPalCaptureResponse;
    try {
      paypalData = await paypalResponse.json();
    } catch (jsonError) {
      console.error("Failed to parse PayPal response:", jsonError);
      
      // Persist JSON parsing error
      try {
        const transactionResult = await upsertPaymentTransaction({
          userId,
          orderId: orderID,
          captureId: undefined,
          amount: "0",
          currency: "USD",
          status: "JSON_PARSE_ERROR",
          rawPayload: {
            error: {
              type: "JSON_PARSE_ERROR",
              message: jsonError instanceof Error ? jsonError.message : "Failed to parse PayPal response",
            },
            orderID,
            userId,
            timestamp: new Date().toISOString(),
          },
        });

        if (transactionResult.success && transactionResult.transactionId) {
          await createPaymentAuditLog({
            transactionId: transactionResult.transactionId,
            newStatus: "JSON_PARSE_ERROR",
            changedBy: "system",
            reason: "Failed to parse PayPal API response",
          });
        }
      } catch (dbError) {
        console.error("Database error during JSON parse error persistence:", dbError);
      }

      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from payment service. Please try again.",
        },
        { status: 502 }
      );
    }

    // Validate payment completion
    if (paypalData.status === "COMPLETED") {
      // Extract payment details for persistence
      const captureDetails =
        paypalData.purchase_units?.[0]?.payments?.captures?.[0];

      try {
        // Persist payment transaction to database
        const transactionResult = await upsertPaymentTransaction({
          userId,
          orderId: paypalData.id,
          captureId: captureDetails?.id,
          amount: captureDetails?.amount?.value || "0",
          currency: captureDetails?.amount?.currency_code || "USD",
          status: paypalData.status,
          rawPayload: paypalData,
          verifiedAt: new Date(),
        });

        if (!transactionResult.success) {
          console.error("Failed to persist payment transaction:", transactionResult.error);
          // Continue with response even if persistence fails
        } else if (transactionResult.transactionId) {
          // Create initial audit log entry
          await createPaymentAuditLog({
            transactionId: transactionResult.transactionId,
            newStatus: paypalData.status,
            changedBy: "paypal",
            reason: "Payment captured successfully",
          });
        }

        // Log successful payment for monitoring
        console.log("Payment completed and persisted successfully:", {
          userId,
          orderID: paypalData.id,
          captureId: captureDetails?.id,
          amount: captureDetails?.amount,
          status: paypalData.status,
          transactionId: transactionResult.transactionId,
          timestamp: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: "Payment verified successfully!",
          orderID: paypalData.id,
        });
      } catch (dbError) {
        console.error("Database error during payment persistence:", dbError);
        // Return success response even if persistence fails to avoid blocking user
        return NextResponse.json({
          success: true,
          message: "Payment verified successfully!",
          orderID: paypalData.id,
        });
      }
    }

    // Handle other payment statuses
    console.warn("Payment not completed:", {
      status: paypalData.status,
      orderID: paypalData.id,
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Persist failed/incomplete payment transaction
      const captureDetails = paypalData.purchase_units?.[0]?.payments?.captures?.[0];
      const transactionResult = await upsertPaymentTransaction({
        userId,
        orderId: paypalData.id,
        captureId: captureDetails?.id,
        amount: captureDetails?.amount?.value || "0",
        currency: captureDetails?.amount?.currency_code || "USD",
        status: paypalData.status,
        rawPayload: paypalData,
        // No verifiedAt for incomplete payments
      });

      if (transactionResult.success && transactionResult.transactionId) {
        // Create audit log entry for the status
        await createPaymentAuditLog({
          transactionId: transactionResult.transactionId,
          newStatus: paypalData.status,
          changedBy: "paypal",
          reason: `Payment verification failed - status: ${paypalData.status}`,
        });
      }
    } catch (dbError) {
      console.error("Database error during failed payment persistence:", dbError);
      // Continue with response even if persistence fails
    }

    // Provide specific messages for different statuses
    let statusMessage = "Payment verification failed.";

    switch (paypalData.status) {
      case "APPROVED":
        statusMessage =
          "Payment was approved but not captured. Please try again.";
        break;
      case "CANCELLED":
        statusMessage = "Payment was cancelled. Please start a new payment.";
        break;
      case "PAYER_ACTION_REQUIRED":
        statusMessage =
          "Additional action required from payer. Please complete the payment process.";
        break;
      default:
        statusMessage = `Payment is in ${paypalData.status} status. Please try again or contact support.`;
    }

    return NextResponse.json(
      {
        success: false,
        message: statusMessage,
      },
      { status: 400 }
    );
  } catch (error) {
    // Log the full error for debugging (server-side only)
    console.error("PayPal verification unexpected error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Persist unexpected error
    try {
      const transactionResult = await upsertPaymentTransaction({
        userId: "unknown", // We don't have userId in this catch block
        orderId: "unknown", // We don't have orderID in this catch block
        captureId: undefined,
        amount: "0",
        currency: "USD",
        status: "UNEXPECTED_ERROR",
        rawPayload: {
          error: {
            type: "UNEXPECTED_ERROR",
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
          },
          timestamp: new Date().toISOString(),
        },
      });

      if (transactionResult.success && transactionResult.transactionId) {
        await createPaymentAuditLog({
          transactionId: transactionResult.transactionId,
          newStatus: "UNEXPECTED_ERROR",
          changedBy: "system",
          reason: "Unexpected error during PayPal verification",
        });
      }
    } catch (dbError) {
      console.error("Database error during unexpected error persistence:", dbError);
    }

    // Return generic error to client (don't expose internal details)
    return NextResponse.json(
      {
        success: false,
        message:
          "Payment verification failed due to a server error. Please try again or contact support.",
      },
      { status: 500 }
    );
  }
}

// Handle unsupported HTTP methods
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed - Use POST to verify payments",
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed - Use POST to verify payments",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: "Method not allowed - Use POST to verify payments",
    },
    { status: 405 }
  );
}

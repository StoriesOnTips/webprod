// app/api/webhooks/polar/route.ts
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { addCreditsToUser, verifyPolarWebhookSignature } from '@/lib/actions/payment-actions';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let eventType = 'unknown';
  let orderId = 'unknown';

  try {
    // Read request body
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('polar-signature');
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    // Verify webhook signature for security
    if (!webhookSecret) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!verifyPolarWebhookSignature(body, signature, webhookSecret)) {
      console.warn('Invalid webhook signature:', { signature: signature?.slice(0, 10) + '...' });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    eventType = event.type || 'unknown';
    orderId = event.data?.id || 'unknown';

    console.log(`Polar webhook received: ${eventType} for order ${orderId}`);

    // Handle successful order events
    if (eventType === 'order.created' && event.data?.status === 'succeeded') {
      const metadata = event.data.metadata;
      
      // Validate required metadata
      const userId = metadata?.userId;
      const packageId = parseInt(metadata?.packageId);
      const credits = parseInt(metadata?.credits);
      
      if (!userId || !packageId || !credits) {
        console.error('Missing required metadata:', { 
          userId: !!userId, 
          packageId: !!packageId, 
          credits: !!credits,
          metadata 
        });
        return NextResponse.json({ error: 'Invalid webhook metadata' }, { status: 400 });
      }

      // Validate data types and ranges
      if (typeof userId !== 'string' || userId.length < 1) {
        return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
      }

      if (![1, 2, 3, 4].includes(packageId)) {
        return NextResponse.json({ error: 'Invalid packageId' }, { status: 400 });
      }

      if (credits < 1 || credits > 100) {
        return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
      }

      // Process payment
      const result = await addCreditsToUser(userId, credits, event.data.id, packageId);
      
      if (!result.success) {
        console.error('Failed to add credits:', {
          orderId: event.data.id,
          userId,
          credits,
          error: result.error
        });
        return NextResponse.json({ 
          error: 'Failed to process payment', 
          details: result.message 
        }, { status: 500 });
      }

      console.log(`Webhook processed successfully: ${credits} coins added to user ${userId} (${Date.now() - startTime}ms)`);
      
      return NextResponse.json({ 
        received: true, 
        processed: true,
        orderId: event.data.id,
        newBalance: result.newBalance
      });
    }

    // Handle other event types
    console.log(`Webhook event ${eventType} not processed (status: ${event.data?.status})`);
    return NextResponse.json({ received: true, processed: false });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Polar webhook processing error:', {
      error: error instanceof Error ? error.message : error,
      eventType,
      orderId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      error: 'Webhook processing failed',
      orderId 
    }, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy', 
    service: 'polar-webhook',
    timestamp: new Date().toISOString()
  });
}
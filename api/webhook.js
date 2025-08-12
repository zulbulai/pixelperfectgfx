// File: api/webhook.js
// Razorpay Webhook Handler for Subscription Events

import crypto from 'crypto';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔔 Webhook received at:', new Date().toISOString());
        
        // Get webhook signature from headers
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.WEBHOOK_SECRET;

        // Verify webhook secret is configured
        if (!webhookSecret) {
            console.error('❌ WEBHOOK_SECRET not configured');
            return res.status(500).json({ 
                error: 'Webhook secret not configured',
                message: 'Please add WEBHOOK_SECRET to environment variables' 
            });
        }

        // Verify webhook signature for security
        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('❌ Invalid webhook signature');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        // Parse webhook data
        const { event, payload, created_at } = req.body;
        
        console.log(`📋 Processing event: ${event}`);
        console.log(`🆔 Event ID: ${payload.subscription?.entity?.id || 'N/A'}`);

        // Handle different subscription events
        let result = {};
        
        switch (event) {
            case 'subscription.authenticated':
                result = await handleSubscriptionAuthenticated(payload);
                break;
                
            case 'subscription.activated':
                result = await handleSubscriptionActivated(payload);
                break;
                
            case 'subscription.charged':
                result = await handleSubscriptionCharged(payload);
                break;
                
            case 'subscription.paused':
                result = await handleSubscriptionPaused(payload);
                break;
                
            case 'subscription.resumed':
                result = await handleSubscriptionResumed(payload);
                break;
                
            case 'subscription.pending':
                result = await handleSubscriptionPending(payload);
                break;
                
            case 'subscription.halted':
                result = await handleSubscriptionHalted(payload);
                break;
                
            case 'subscription.cancelled':
                result = await handleSubscriptionCancelled(payload);
                break;
                
            case 'subscription.completed':
                result = await handleSubscriptionCompleted(payload);
                break;
                
            case 'subscription.updated':
                result = await handleSubscriptionUpdated(payload);
                break;
                
            default:
                console.log(`⚠️ Unhandled event type: ${event}`);
                result = { 
                    status: 'ignored', 
                    message: `Event ${event} received but not handled`
                };
        }

        console.log(`✅ Event ${event} processed successfully`);
        
        return res.status(200).json({
            received: true,
            event: event,
            status: 'processed',
            timestamp: new Date().toISOString(),
            result: result
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        
        // Send error notification
        await sendErrorNotification(error, req);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Webhook processing failed',
            timestamp: new Date().toISOString()
        });
    }
}

// Event Handlers
async function handleSubscriptionAuthenticated(payload) {
    const subscription = payload.subscription.entity;
    console.log(`🔐 Subscription authenticated: ${subscription.id}`);
    
    // TODO: Update your database
    // await updateSubscriptionStatus(subscription.id, 'authenticated');
    
    // TODO: Send welcome email
    // await sendWelcomeEmail(subscription);
    
    return { 
        status: 'success', 
        message: 'Subscription authenticated successfully',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionActivated(payload) {
    const subscription = payload.subscription.entity;
    console.log(`🟢 Subscription activated: ${subscription.id}`);
    
    // TODO: Enable user access
    // await enableUserAccess(subscription.id);
    
    // TODO: Send activation email
    // await sendActivationEmail(subscription);
    
    return { 
        status: 'success', 
        message: 'Subscription activated successfully',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionCharged(payload) {
    const payment = payload.payment.entity;
    const subscription = payload.subscription.entity;
    
    console.log(`💰 Payment successful: ${payment.id} for subscription: ${subscription.id}`);
    console.log(`💵 Amount: ₹${payment.amount / 100}`);
    
    // TODO: Record payment
    // await recordPayment(payment, subscription);
    
    // TODO: Send payment confirmation
    // await sendPaymentConfirmation(payment, subscription);
    
    return { 
        status: 'success', 
        message: 'Payment recorded successfully',
        payment_id: payment.id,
        amount: payment.amount / 100
    };
}

async function handleSubscriptionPaused(payload) {
    const subscription = payload.subscription.entity;
    console.log(`⏸️ Subscription paused: ${subscription.id}`);
    
    // TODO: Disable access but keep data
    // await disableUserAccess(subscription.id);
    
    return { 
        status: 'success', 
        message: 'Subscription paused successfully',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionResumed(payload) {
    const subscription = payload.subscription.entity;
    console.log(`▶️ Subscription resumed: ${subscription.id}`);
    
    // TODO: Re-enable access
    // await enableUserAccess(subscription.id);
    
    return { 
        status: 'success', 
        message: 'Subscription resumed successfully',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionPending(payload) {
    const subscription = payload.subscription.entity;
    console.log(`⏳ Payment retry pending: ${subscription.id}`);
    
    // TODO: Notify user about retry
    // await sendRetryNotification(subscription);
    
    return { 
        status: 'success', 
        message: 'Payment retry pending',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionHalted(payload) {
    const subscription = payload.subscription.entity;
    console.log(`🛑 Subscription halted: ${subscription.id}`);
    
    // TODO: Suspend access with grace period
    // await suspendUserAccess(subscription.id);
    
    return { 
        status: 'success', 
        message: 'Subscription halted successfully',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionCancelled(payload) {
    const subscription = payload.subscription.entity;
    console.log(`❌ Subscription cancelled: ${subscription.id}`);
    
    // TODO: Handle cancellation
    // await handleCancellation(subscription.id);
    
    return { 
        status: 'success', 
        message: 'Subscription cancelled successfully',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionCompleted(payload) {
    const subscription = payload.subscription.entity;
    console.log(`✅ Subscription completed: ${subscription.id}`);
    
    // TODO: Handle completion
    // await handleCompletion(subscription.id);
    
    return { 
        status: 'success', 
        message: 'Subscription completed successfully',
        subscription_id: subscription.id
    };
}

async function handleSubscriptionUpdated(payload) {
    const subscription = payload.subscription.entity;
    console.log(`🔄 Subscription updated: ${subscription.id}`);
    
    // TODO: Update subscription details
    // await updateSubscription(subscription);
    
    return { 
        status: 'success', 
        message: 'Subscription updated successfully',
        subscription_id: subscription.id
    };
}

// Send error notification to admin
async function sendErrorNotification(error, req) {
    try {
        console.log('📧 Error details:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            webhook_event: req.body?.event || 'unknown',
            subscription_id: req.body?.payload?.subscription?.entity?.id || 'N/A'
        });
        
        // TODO: Implement email service
        // You can use services like SendGrid, Nodemailer, etc.
        
    } catch (emailError) {
        console.error('Failed to send error notification:', emailError);
    }
}

// File: api/create-subscription.js
// Razorpay Subscription Creation API

import Razorpay from 'razorpay';

// Initialize Razorpay with your credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are allowed' 
        });
    }

    try {
        console.log('🔔 Create subscription request received');
        console.log('Request body:', req.body);

        // Validate environment variables
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error('❌ Razorpay credentials not configured');
            return res.status(500).json({
                error: 'Configuration error',
                message: 'Payment system not properly configured'
            });
        }

        // Extract and validate request data
        const { plan_id, customer_notify = 1, notes = {} } = req.body;

        if (!plan_id) {
            return res.status(400).json({
                error: 'Missing plan_id',
                message: 'Plan ID is required to create subscription'
            });
        }

        // Create subscription options
        const subscriptionOptions = {
            plan_id: plan_id,
            customer_notify: customer_notify,
            total_count: 12, // Total billing cycles (adjust as needed)
            notes: {
                created_by: 'PixelPerfect Graphix Website',
                website: req.headers.host || 'pixelperfectgraphix.vercel.app',
                timestamp: new Date().toISOString(),
                ...notes
            }
        };

        console.log('📋 Creating subscription with options:', subscriptionOptions);

        // Create subscription using Razorpay API
        const subscription = await razorpay.subscriptions.create(subscriptionOptions);

        console.log('✅ Subscription created successfully:', subscription.id);

        // Return subscription details
        return res.status(200).json({
            success: true,
            subscription_id: subscription.id,
            status: subscription.status,
            plan_id: subscription.plan_id,
            customer_notify: subscription.customer_notify,
            created_at: subscription.created_at,
            notes: subscription.notes
        });

    } catch (error) {
        console.error('❌ Subscription creation error:', error);

        // Handle Razorpay specific errors
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                error: 'Razorpay API Error',
                message: error.error?.description || 'Failed to create subscription',
                code: error.error?.code || 'UNKNOWN_ERROR',
                details: error.error
            });
        }

        // Handle other errors
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to create subscription. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
}

// File: api/contact.js
// Contact Form Handler

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
        console.log('📧 Contact form submission received');
        
        // Extract form data
        const { name, email, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Name, email, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format',
                message: 'Please provide a valid email address'
            });
        }

        // Log contact form data
        console.log('Contact form data:', {
            name,
            email,
            message: message.substring(0, 100) + '...', // Log first 100 chars only
            timestamp: new Date().toISOString(),
            ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
        });

        // TODO: Save to database
        // await saveContactSubmission({ name, email, message, timestamp: new Date() });

        // TODO: Send email notification to admin
        // await sendContactNotification({ name, email, message });

        // TODO: Send auto-reply to user
        // await sendAutoReply(email, name);

        // For now, we'll just log it
        console.log('✅ Contact form processed successfully');

        return res.status(200).json({
            success: true,
            message: 'Your message has been sent successfully. We will get back to you soon!',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Contact form processing error:', error);

        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to send message. Please try again or contact us directly.',
            timestamp: new Date().toISOString()
        });
    }
}

// Configuration
const CONFIG = {
    RAZORPAY_KEY_ID: 'rzp_live_R6zs7J50awSUhd', // आपकी live key
    COMPANY_NAME: 'PixelPerfect Graphix',
    COMPANY_EMAIL: 'palgunnao@gmail.com',
    WEBHOOK_URL: '/api/webhook',
    API_BASE_URL: window.location.origin
};

// Plan configurations - Razorpay dashboard से actual Plan IDs replace करें
const PLAN_CONFIGS = {
    monthly: {
        planId: 'plan_MONTHLY_PLAN_ID', // Replace with actual plan ID
        name: 'Monthly Graphics Plan',
        description: 'Monthly subscription for premium templates',
        amount: 4900 // in paise
    },
    quarterly: {
        planId: 'plan_QUARTERLY_PLAN_ID', // Replace with actual plan ID
        name: 'Quarterly Graphics Plan',
        description: 'Quarterly subscription for premium templates',
        amount: 9900 // in paise
    },
    annual: {
        planId: 'plan_ANNUAL_PLAN_ID', // Replace with actual plan ID
        name: 'Annual Graphics Plan',
        description: 'Annual subscription for premium templates',
        amount: 29900 // in paise
    }
};

// DOM Elements
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingOverlay = document.getElementById('loadingOverlay');
const contactForm = document.getElementById('contactForm');

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('PixelPerfect Graphix Subscription Site Loaded');
    
    // Check if Razorpay is loaded
    if (typeof Razorpay === 'undefined') {
        console.error('Razorpay SDK not loaded');
        showError('Payment system not available. Please refresh the page.');
        return;
    }
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize contact form
    initializeContactForm();
    
    // Initialize animations
    initializeAnimations();
    
    console.log('Razorpay Key:', CONFIG.RAZORPAY_KEY_ID);
});

// Main subscription handler
async function handleSubscription(planType, amount) {
    try {
        console.log(`Initiating subscription for ${planType} plan: ₹${amount}`);
        
        // Show loading
        showLoading();
        hideMessages();
        
        // Get plan configuration
        const planConfig = PLAN_CONFIGS[planType];
        if (!planConfig) {
            throw new Error('Invalid plan type');
        }
        
        // Create subscription
        const subscriptionId = await createSubscription(planConfig);
        
        // Configure Razorpay options
        const options = {
            key: CONFIG.RAZORPAY_KEY_ID,
            subscription_id: subscriptionId,
            name: CONFIG.COMPANY_NAME,
            description: planConfig.description,
            image: '/favicon.ico', // Add your logo here
            handler: function(response) {
                handlePaymentSuccess(response, planType, amount);
            },
            prefill: {
                name: '',
                email: '',
                contact: ''
            },
            notes: {
                plan_type: planType,
                amount: amount,
                website: window.location.hostname
            },
            theme: {
                color: '#667eea'
            },
            modal: {
                ondismiss: function() {
                    hideLoading();
                    console.log('Payment modal dismissed');
                },
                escape: true,
                backdropclose: false
            },
            retry: {
                enabled: true,
                max_count: 3
            }
        };

        // Hide loading before opening Razorpay
        hideLoading();

        // Open Razorpay checkout
        const rzp = new Razorpay(options);
        
        rzp.on('payment.failed', function(response) {
            handlePaymentFailure(response);
        });
        
        rzp.open();

    } catch (error) {
        console.error('Subscription error:', error);
        hideLoading();
        showError(error.message || 'Failed to initiate subscription. Please try again.');
    }
}

// Create subscription via API
async function createSubscription(planConfig) {
    try {
        console.log('Creating subscription for plan:', planConfig.planId);
        
        const response = await fetch('/api/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plan_id: planConfig.planId,
                customer_notify: 1,
                notes: {
                    plan_name: planConfig.name,
                    website: window.location.hostname
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create subscription');
        }
        
        const data = await response.json();
        
        if (!data.subscription_id) {
            throw new Error('No subscription ID received');
        }
        
        console.log('Subscription created:', data.subscription_id);
        return data.subscription_id;
        
    } catch (error) {
        console.error('Error creating subscription:', error);
        throw new Error('Unable to create subscription. Please try again.');
    }
}

// Handle successful payment
function handlePaymentSuccess(response, planType, amount) {
    console.log('Payment successful:', response);
    
    hideLoading();
    showSuccess();
    
    // Log payment details
    console.log('Payment ID:', response.razorpay_payment_id);
    console.log('Subscription ID:', response.razorpay_subscription_id);
    console.log('Signature:', response.razorpay_signature);
    
    // Send confirmation to backend
    sendPaymentConfirmation(response, planType, amount);
    
    // Show success message with plan details
    setTimeout(() => {
        showAccessInstructions(planType);
    }, 2000);
    
    // Track conversion (you can add Google Analytics, Facebook Pixel etc.)
    trackConversion(planType, amount);
}

// Handle payment failure
function handlePaymentFailure(response) {
    console.error('Payment failed:', response.error);
    
    hideLoading();
    
    let errorMessage = 'Payment failed. Please try again.';
    
    if (response.error) {
        switch (response.error.code) {
            case 'BAD_REQUEST_ERROR':
                errorMessage = 'Invalid payment request. Please contact support.';
                break;
            case 'GATEWAY_ERROR':
                errorMessage = 'Payment gateway error. Please try again.';
                break;
            case 'NETWORK_ERROR':
                errorMessage = 'Network error. Please check your connection.';
                break;
            case 'SERVER_ERROR':
                errorMessage = 'Server error. Please try again later.';
                break;
            default:
                errorMessage = response.error.description || errorMessage;
        }
    }
    
    showError(errorMessage);
    
    // Log error details for debugging
    if (response.error) {
        console.log('Error code:', response.error.code);
        console.log('Error description:', response.error.description);
        console.log('Error reason:', response.error.reason);
        console.log('Error step:', response.error.step);
    }
}

// Send payment confirmation to backend
async function sendPaymentConfirmation(response, planType, amount) {
    try {
        await fetch('/api/payment-confirmation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payment_id: response.razorpay_payment_id,
                subscription_id: response.razorpay_subscription_id,
                signature: response.razorpay_signature,
                plan_type: planType,
                amount: amount,
                timestamp: new Date().toISOString()
            })
        });
        
        console.log('Payment confirmation sent to backend');
    } catch (error) {
        console.error('Error sending payment confirmation:', error);
    }
}

// Show success message
function showSuccess() {
    successMessage.style.display = 'block';
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto hide after 10 seconds
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 10000);
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto hide after 8 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 8000);
}

// Hide all messages
function hideMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Show loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Show access instructions after successful payment
function showAccessInstructions(planType) {
    const instructions = {
        monthly: {
            title: '🎉 Monthly Plan Activated!',
            message: 'आप अब 1000+ premium templates access कर सकते हैं!\n\n• Commercial license included\n• Email support available\n• Templates updated weekly'
        },
        quarterly: {
            title: '🎉 Quarterly Plan Activated!',
            message: 'आप अब 3000+ premium templates और priority support access कर सकते हैं!\n\n• Priority support\n• Brand guidelines included\n• 24hr delivery guaranteed'
        },
        annual: {
            title: '🎉 Annual Plan Activated!',
            message: 'आप अब 5000+ premium templates और सभी premium features access कर सकते हैं!\n\n• Dedicated account manager\n• Custom templates available\n• Same day delivery'
        }
    };
    
    const plan = instructions[planType] || instructions.monthly;
    
    alert(`${plan.title}\n\n${plan.message}\n\nआपको email confirmation भी मिल जाएगी।\n\nDashboard: ${window.location.origin}/dashboard`);
}

// Initialize smooth scrolling
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize contact form
function initializeContactForm() {
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            };
            
            try {
                // Show loading on submit button
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                submitBtn.disabled = true;
                
                // Send contact form data
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    showSuccess();
                    this.reset();
                } else {
                    throw new Error('Failed to send message');
                }
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
            } catch (error) {
                console.error('Contact form error:', error);
                showError('Failed to send message. Please try again or contact us directly.');
                
                // Reset button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.innerHTML = 'Send Message';
                submitBtn.disabled = false;
            }
        });
    }
}

// Initialize animations (optional)
function initializeAnimations() {
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.pricing-card, .feature-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Track conversion for analytics
function trackConversion(planType, amount) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'purchase', {
            transaction_id: Date.now().toString(),
            value: amount,
            currency: 'INR',
            items: [{
                item_id: planType,
                item_name: `Graphics Design ${planType} Plan`,
                category: 'Subscription',
                quantity: 1,
                price: amount
            }]
        });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Purchase', {
            value: amount,
            currency: 'INR',
            content_type: 'product',
            content_ids: [planType]
        });
    }
    
    console.log('Conversion tracked:', { planType, amount });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(new Date(date));
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        console.log('Page is visible again');
        // You can add logic to refresh subscription status
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    console.log('Connection restored');
    hideError();
});

window.addEventListener('offline', function() {
    console.log('Connection lost');
    showError('Internet connection lost. Please check your connection.');
});

// Export functions for global use
window.handleSubscription = handleSubscription;
window.showSuccess = showSuccess;
window.showError = showError;
window.hideMessages = hideMessages;

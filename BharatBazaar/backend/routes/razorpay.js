/* ===================================
   RAZORPAY INTEGRATION ROUTES
   Real payment gateway integration for BharatBazaar
   =================================== */

const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const { resolveCustomer } = require('../middleware/guestSession');

// Initialize Razorpay instance (or demo mode if keys not configured)
const DEMO_MODE = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_YOUR_KEY_HERE';

let razorpay;
if (!DEMO_MODE) {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
}

if (DEMO_MODE) {
    console.log('⚠️  [Razorpay] Running in DEMO MODE - real keys not configured');
    console.log('   Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env for real payments');
}

// ─── CREATE RAZORPAY ORDER ────────────────────────────────────────────────────
// POST /api/razorpay/create-order
// Creates a Razorpay order for checkout (test mode)
router.post('/create-order', resolveCustomer, async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        // DEMO MODE: Return mock order
        if (DEMO_MODE) {
            const mockOrderId = `demo_order_${Date.now()}`;
            console.log(`[Razorpay DEMO] Mock order created: ${mockOrderId} | Amount: ₹${amount}`);
            
            return res.json({
                success: true,
                orderId: mockOrderId,
                amount: Math.round(amount * 100),
                currency: currency,
                razorpayKeyId: 'rzp_test_demo',
                demoMode: true
            });
        }

        // Razorpay expects amount in smallest currency unit (paise for INR)
        const amountInPaise = Math.round(amount * 100);

        const options = {
            amount: amountInPaise,
            currency: currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            notes: notes || {},
            payment_capture: 1 // Auto-capture payment
        };

        const razorpayOrder = await razorpay.orders.create(options);

        console.log(`[Razorpay] Order created: ${razorpayOrder.id} | Amount: ₹${amount}`);

        res.json({
            success: true,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('[Razorpay] Create order error:', error);
        res.status(500).json({
            error: 'Failed to create Razorpay order',
            message: error.message
        });
    }
});

// ─── VERIFY PAYMENT ────────────────────────────────────────────────────────────
// POST /api/razorpay/verify-payment
// Verifies payment signature after successful payment
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderRefId // Our internal order ID
        } = req.body;

        // DEMO MODE: Auto-approve
        if (DEMO_MODE || razorpay_order_id?.startsWith('demo_order_')) {
            console.log(`[Razorpay DEMO] Payment auto-verified for order ${razorpay_order_id}`);
            
            if (orderRefId) {
                const order = await Order.findOne({ orderId: orderRefId });
                if (order) {
                    order.payment.status = 'paid';
                    order.payment.razorpayOrderId = razorpay_order_id;
                    order.payment.razorpayPaymentId = razorpay_payment_id || `demo_pay_${Date.now()}`;
                    order.payment.paidAt = new Date();
                    order.status = 'confirmed';
                    await order.save();
                }
            }
            
            return res.json({
                success: true,
                verified: true,
                message: 'Payment verified successfully (DEMO MODE)',
                demoMode: true
            });
        }

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification parameters' });
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('[Razorpay] Signature verification failed');
            return res.status(400).json({
                error: 'Payment verification failed',
                verified: false
            });
        }

        // Update order status in database
        if (orderRefId) {
            const order = await Order.findOne({ orderId: orderRefId });
            if (order) {
                order.payment.status = 'paid';
                order.payment.razorpayOrderId = razorpay_order_id;
                order.payment.razorpayPaymentId = razorpay_payment_id;
                order.payment.paidAt = new Date();
                order.status = 'confirmed';
                await order.save();

                console.log(`[Razorpay] Payment verified for order ${orderRefId}`);
            }
        }

        res.json({
            success: true,
            verified: true,
            message: 'Payment verified successfully'
        });
    } catch (error) {
        console.error('[Razorpay] Verify payment error:', error);
        res.status(500).json({
            error: 'Payment verification failed',
            message: error.message
        });
    }
});

// ─── WEBHOOK HANDLER ───────────────────────────────────────────────────────────
// POST /api/razorpay/webhook
// Handles Razorpay webhook events (payment.captured, payment.failed, etc.)
// CRITICAL: Signature verification is mandatory - never skip this in production
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET not configured');
            return res.status(500).json({ error: 'Webhook secret not configured' });
        }

        const webhookSignature = req.headers['x-razorpay-signature'];
        
        if (!webhookSignature) {
            console.error('[Razorpay Webhook] Missing signature header');
            return res.status(400).json({ error: 'Missing webhook signature' });
        }

        // Verify webhook signature
        const webhookBody = req.body.toString();
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(webhookBody)
            .digest('hex');

        if (webhookSignature !== expectedSignature) {
            console.error('[Razorpay Webhook] Signature verification failed');
            return res.status(400).json({ error: 'Invalid webhook signature' });
        }

        // Parse event
        const event = JSON.parse(webhookBody);
        const eventType = event.event;
        const payload = event.payload.payment ? event.payload.payment.entity : event.payload.order?.entity;

        console.log(`[Razorpay Webhook] Event received: ${eventType} | ID: ${payload?.id}`);

        // Handle different event types
        switch (eventType) {
            case 'payment.captured':
                await handlePaymentCaptured(payload);
                break;

            case 'payment.failed':
                await handlePaymentFailed(payload);
                break;

            case 'payment.authorized':
                await handlePaymentAuthorized(payload);
                break;

            case 'order.paid':
                await handleOrderPaid(payload);
                break;

            default:
                console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
        }

        // Send acknowledgment
        res.status(200).json({ status: 'ok' });
    } catch (error) {
        console.error('[Razorpay Webhook] Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// ─── WEBHOOK EVENT HANDLERS ────────────────────────────────────────────────────

async function handlePaymentCaptured(payment) {
    try {
        console.log(`[Razorpay] Payment captured: ${payment.id} | Amount: ₹${payment.amount / 100}`);

        // Find order by Razorpay order ID
        const order = await Order.findOne({ 'payment.razorpayOrderId': payment.order_id });

        if (order) {
            order.payment.status = 'paid';
            order.payment.razorpayPaymentId = payment.id;
            order.payment.paidAt = new Date();
            order.status = 'confirmed';
            await order.save();

            console.log(`[Razorpay] Order ${order.orderId} marked as paid`);
        }

        // Send event to NFV5 if available
        await notifyNFV5({
            eventType: 'payment.success',
            severity: 'INFO',
            paymentId: payment.id,
            orderId: payment.order_id,
            amount: payment.amount / 100,
            currency: payment.currency,
            method: payment.method,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('[Razorpay] Handle payment captured error:', error);
    }
}

async function handlePaymentFailed(payment) {
    try {
        console.error(`[Razorpay] Payment failed: ${payment.id} | Error: ${payment.error_description}`);

        // Find order by Razorpay order ID
        const order = await Order.findOne({ 'payment.razorpayOrderId': payment.order_id });

        if (order) {
            order.payment.status = 'failed';
            order.payment.failureReason = payment.error_description || 'Payment failed';
            order.status = 'payment_failed';
            await order.save();

            console.log(`[Razorpay] Order ${order.orderId} marked as payment failed`);
        }

        // Send CRITICAL event to NFV5 - payment failures should trigger detection
        await notifyNFV5({
            eventType: 'payment.failed',
            severity: 'CRITICAL',
            paymentId: payment.id,
            orderId: payment.order_id,
            amount: payment.amount / 100,
            currency: payment.currency,
            errorCode: payment.error_code,
            errorDescription: payment.error_description,
            method: payment.method,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('[Razorpay] Handle payment failed error:', error);
    }
}

async function handlePaymentAuthorized(payment) {
    try {
        console.log(`[Razorpay] Payment authorized: ${payment.id} | Amount: ₹${payment.amount / 100}`);

        const order = await Order.findOne({ 'payment.razorpayOrderId': payment.order_id });

        if (order) {
            order.payment.status = 'authorized';
            order.payment.razorpayPaymentId = payment.id;
            await order.save();
        }

        await notifyNFV5({
            eventType: 'payment.authorized',
            severity: 'INFO',
            paymentId: payment.id,
            orderId: payment.order_id,
            amount: payment.amount / 100,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('[Razorpay] Handle payment authorized error:', error);
    }
}

async function handleOrderPaid(order) {
    try {
        console.log(`[Razorpay] Order paid: ${order.id} | Amount: ₹${order.amount / 100}`);

        await notifyNFV5({
            eventType: 'order.paid',
            severity: 'INFO',
            orderId: order.id,
            amount: order.amount / 100,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('[Razorpay] Handle order paid error:', error);
    }
}

// ─── NFV5 INTEGRATION ──────────────────────────────────────────────────────────
// Sends payment events to NFV5 backend for detection and correlation

async function notifyNFV5(eventData) {
    try {
        const nfv5Url = process.env.NFV5_BACKEND_URL || 'http://localhost:3001';
        const endpoint = `${nfv5Url}/api/razorpay/event`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            console.log(`[NFV5] Event sent: ${eventData.eventType}`);
        } else {
            console.error(`[NFV5] Failed to send event: ${response.status}`);
        }
    } catch (error) {
        // Non-fatal - BharatBazaar should work even if NFV5 is offline
        console.error('[NFV5] Notification error:', error.message);
    }
}

// ─── GET PAYMENT STATUS ────────────────────────────────────────────────────────
// GET /api/razorpay/payment/:paymentId
// Retrieves payment status from Razorpay
router.get('/payment/:paymentId', async (req, res) => {
    try {
        const payment = await razorpay.payments.fetch(req.params.paymentId);

        res.json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount / 100,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                captured: payment.captured,
                createdAt: payment.created_at
            }
        });
    } catch (error) {
        console.error('[Razorpay] Fetch payment error:', error);
        res.status(500).json({
            error: 'Failed to fetch payment status',
            message: error.message
        });
    }
});

module.exports = router;

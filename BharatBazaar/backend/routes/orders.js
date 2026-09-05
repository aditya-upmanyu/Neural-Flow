/* ===================================
   ORDER ROUTES
   Guest + Authenticated Checkout & Order Management
   =================================== */

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken, checkRole } = require('../middleware/auth');
const { resolveCustomer, getCartFilter } = require('../middleware/guestSession');

// ─── STATIC ROUTES (must come before /:orderId) ──────────────────────────────

// GET /api/orders/my-orders — authenticated users only
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId })
            .sort({ createdAt: -1 });
        res.json({ orders });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// GET /api/orders/seller/all — seller only
router.get('/seller/all', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const orders = await Order.find()
            .populate({
                path: 'items.productId',
                match: { sellerId: req.user.userId }
            })
            .sort({ createdAt: -1 });

        const sellerOrders = orders.filter(order =>
            order.items.some(item => item.productId && item.productId.sellerId)
        );

        res.json({ orders: sellerOrders });
    } catch (error) {
        console.error('Get seller orders error:', error);
        res.status(500).json({ error: 'Server error fetching orders' });
    }
});

// ─── CREATE ORDER (guest or authenticated) ───────────────────────────────────

// POST /api/orders/create
router.post('/create', resolveCustomer, async (req, res) => {
    try {
        const { shippingAddress, paymentMethod, items: bodyItems } = req.body;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone ||
            !shippingAddress.address || !shippingAddress.city ||
            !shippingAddress.state || !shippingAddress.pincode) {
            return res.status(400).json({ error: 'Complete shipping address is required' });
        }

        // Try to load cart from DB; fallback to items sent in body (guest with localStorage)
        let cartItems = [];

        const cartFilter = getCartFilter(req);
        const cart = await Cart.findOne(cartFilter).populate('items.productId');

        if (cart && cart.items.length > 0) {
            cartItems = cart.items;
        } else if (bodyItems && bodyItems.length > 0) {
            // Guest sent items directly (from localStorage cart)
            cartItems = bodyItems;
        } else {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Build order items and calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of cartItems) {
            // item may be a Mongoose doc (from DB cart) or a plain object (body)
            const productId = item.productId?._id || item.productId || item.product_id;
            const product = item.productId?.name
                ? item.productId   // already populated
                : await Product.findById(productId);

            if (!product) {
                return res.status(400).json({ error: `Product ${productId} not found` });
            }

            const qty = item.quantity || 1;

            if (product.stock < qty) {
                return res.status(400).json({
                    error: `Insufficient stock for ${product.name} (available: ${product.stock})`
                });
            }

            const itemTotal = product.price * qty;
            subtotal += itemTotal;

            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: qty,
                image: (product.images && product.images[0]) || ''
            });
        }

        const tax = Math.round(subtotal * 0.18);
        const shipping = 0;
        const total = subtotal + tax + shipping;

        // Normalize payment method to match enum
        let method = 'COD';
        if (paymentMethod) {
            const pm = String(paymentMethod).toUpperCase();
            if (['COD', 'ONLINE', 'UPI', 'CARD', 'NETBANKING'].includes(pm)) {
                method = pm === 'ONLINE' ? 'Online' :
                         pm === 'UPI'    ? 'UPI' :
                         pm === 'CARD'   ? 'Card' :
                         pm === 'NETBANKING' ? 'NetBanking' : 'COD';
            }
        }

        const order = new Order({
            orderId: 'ORD' + Date.now(),
            userId: req.isGuest ? undefined : req.user?.userId,
            guestSessionId: req.isGuest ? req.guestSessionId : undefined,
            items: orderItems,
            shippingAddress: {
                fullName: shippingAddress.fullName,
                phone: shippingAddress.phone,
                email: shippingAddress.email || '',
                address: shippingAddress.address,
                city: shippingAddress.city,
                state: shippingAddress.state,
                pincode: shippingAddress.pincode,
                country: shippingAddress.country || 'India'
            },
            payment: {
                method,
                amount: total,
                status: method === 'COD' ? 'pending' : 'pending' // Will be updated after Razorpay payment
            },
            pricing: { subtotal, tax, shipping, total },
            status: method === 'COD' ? 'confirmed' : 'pending' // COD orders confirmed immediately
        });

        await order.save();

        // Decrement stock only for COD orders (online payment orders will decrement on payment success)
        if (method === 'COD') {
            for (const item of orderItems) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity, sales: item.quantity }
                });
            }

            // Clear DB cart if it was used
            if (cart && cart.items.length > 0) {
                cart.items = [];
                await cart.save();
            }
        }

        res.status(201).json({
            message: 'Order placed successfully',
            order,
            requiresPayment: method !== 'COD'
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ error: 'Server error creating order' });
    }
});

// ─── SINGLE ORDER LOOKUP ──────────────────────────────────────────────────────

// GET /api/orders/:orderId
router.get('/:orderId', resolveCustomer, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) return res.status(404).json({ error: 'Order not found' });

        // Authorization: owner (user or guest) or seller
        const isOwner = !req.isGuest && order.userId &&
            order.userId.toString() === req.user?.userId;
        const isGuestOwner = req.isGuest && order.guestSessionId === req.guestSessionId;
        const isSeller = req.user?.role === 'seller' || req.user?.role === 'admin';

        if (!isOwner && !isGuestOwner && !isSeller) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Server error fetching order' });
    }
});

// ─── COMPLETE PAYMENT & FULFILL ORDER ─────────────────────────────────────────

// POST /api/orders/:orderId/complete-payment
// Called after successful Razorpay payment to decrement stock and mark order as confirmed
router.post('/:orderId/complete-payment', resolveCustomer, async (req, res) => {
    try {
        const order = await Order.findOne({ orderId: req.params.orderId });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Authorization check
        const isOwner = !req.isGuest && order.userId &&
            order.userId.toString() === req.user?.userId;
        const isGuestOwner = req.isGuest && order.guestSessionId === req.guestSessionId;

        if (!isOwner && !isGuestOwner) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // Only process if payment is marked as paid/authorized
        if (order.payment.status !== 'paid' && order.payment.status !== 'authorized') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        // Check if already processed
        if (order.status === 'confirmed' || order.status === 'processing') {
            return res.json({ message: 'Order already processed', order });
        }

        // Decrement stock and update sales
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity, sales: item.quantity }
            });
        }

        // Update order status
        order.status = 'confirmed';
        await order.save();

        // Clear cart
        const cartFilter = getCartFilter(req);
        const cart = await Cart.findOne(cartFilter);
        if (cart && cart.items.length > 0) {
            cart.items = [];
            await cart.save();
        }

        res.json({
            message: 'Payment completed and order confirmed',
            order
        });
    } catch (error) {
        console.error('Complete payment error:', error);
        res.status(500).json({ error: 'Server error completing payment' });
    }
});

// PUT /api/orders/:orderId/status — seller only
router.put('/:orderId/status', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await Order.findOne({ orderId: req.params.orderId });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.status = status;
        await order.save();

        res.json({ message: 'Order status updated', order });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'Server error updating order status' });
    }
});

module.exports = router;

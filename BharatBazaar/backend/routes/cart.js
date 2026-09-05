/* ===================================
   CART ROUTES
   Guest + Authenticated Shopping Cart
   =================================== */

const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { resolveCustomer, getCartFilter } = require('../middleware/guestSession');

// Helper: get or create cart for the current customer (guest or user)
async function getOrCreateCart(req) {
    const filter = getCartFilter(req);
    let cart = await Cart.findOne(filter);
    if (!cart) {
        cart = new Cart(filter);
        await cart.save();
    }
    return cart;
}

// GET /api/cart — fetch cart
router.get('/', resolveCustomer, async (req, res) => {
    try {
        let cart = await Cart.findOne(getCartFilter(req))
            .populate('items.productId', 'name price images stock status');

        if (!cart) {
            cart = { items: [], totalItems: 0 };
        }

        res.json({ cart });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({ error: 'Server error fetching cart' });
    }
});

// POST /api/cart/add — add item
router.post('/add', resolveCustomer, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId || quantity < 1) {
            return res.status(400).json({ error: 'Invalid product or quantity' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.status !== 'active') return res.status(400).json({ error: 'Product is not available' });
        if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

        const cart = await getOrCreateCart(req);

        const existingIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (existingIndex > -1) {
            const newQty = cart.items[existingIndex].quantity + quantity;
            if (product.stock < newQty) return res.status(400).json({ error: 'Insufficient stock' });
            cart.items[existingIndex].quantity = newQty;
        } else {
            cart.items.push({ productId, quantity });
        }

        await cart.save();
        await cart.populate('items.productId', 'name price images stock status');

        res.json({ message: 'Product added to cart', cart });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Server error adding to cart' });
    }
});

// PUT /api/cart/update/:productId — update quantity
router.put('/update/:productId', resolveCustomer, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;

        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        const cart = await Cart.findOne(getCartFilter(req));
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        const itemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId
        );

        if (itemIndex === -1) return res.status(404).json({ error: 'Item not found in cart' });

        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();
        await cart.populate('items.productId', 'name price images stock status');

        res.json({ message: 'Cart updated successfully', cart });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({ error: 'Server error updating cart' });
    }
});

// DELETE /api/cart/remove/:productId — remove item
router.delete('/remove/:productId', resolveCustomer, async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne(getCartFilter(req));
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );

        await cart.save();
        await cart.populate('items.productId', 'name price images stock status');

        res.json({ message: 'Item removed from cart', cart });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Server error removing from cart' });
    }
});

// DELETE /api/cart/clear — empty cart
router.delete('/clear', resolveCustomer, async (req, res) => {
    try {
        const cart = await Cart.findOne(getCartFilter(req));
        if (!cart) return res.status(404).json({ error: 'Cart not found' });

        cart.items = [];
        await cart.save();

        res.json({ message: 'Cart cleared successfully', cart });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Server error clearing cart' });
    }
});

module.exports = router;

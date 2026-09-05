/* ===================================
   PRODUCT ROUTES
   CRUD Operations for Products
   =================================== */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Product = require('../models/Product');
const { authenticateToken, checkRole } = require('../middleware/auth');

const ensureDatabaseReady = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            error: 'Database unavailable',
            message: 'Product catalog is temporarily unavailable because MongoDB is not connected.',
            instanceId: process.env.INSTANCE_ID || 'BB-NODE-1',
            readyState: mongoose.connection.readyState,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

router.use(ensureDatabaseReady);

// ─── PUBLIC STATIC ROUTES (must come before /:id) ───────────────────────────

// Get featured products (public)
router.get('/featured/list', async (req, res) => {
    try {
        const products = await Product.find({
            status: 'active',
            stock: { $gt: 0 }
        })
            .sort({ rating: -1, createdAt: -1 })
            .limit(8);

        res.json({ products });
    } catch (error) {
        console.error('Get featured products error:', error);
        res.status(500).json({ error: 'Server error fetching featured products' });
    }
});

// Get seller's own products (seller only)
router.get('/seller/my-products', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const products = await Product.find({ sellerId: req.user.userId })
            .sort({ createdAt: -1 });
        res.json({ products });
    } catch (error) {
        console.error('Get seller products error:', error);
        res.status(500).json({ error: 'Server error fetching seller products' });
    }
});

// ─── PUBLIC LIST ROUTE ───────────────────────────────────────────────────────

// Get all products (public) — supports category / search / sortBy / limit / page
router.get('/', async (req, res) => {
    try {
        const { category, search, sortBy, limit, page } = req.query;

        let query = { status: 'active' };

        if (category && category !== 'all') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 12;
        const skip = (pageNum - 1) * limitNum;

        let sort = {};
        switch (sortBy) {
            case 'price-asc':  sort.price = 1;       break;
            case 'price-desc': sort.price = -1;      break;
            case 'name':       sort.name = 1;        break;
            case 'rating':     sort['rating.average'] = -1; break;
            case 'newest':
            default:           sort.createdAt = -1;  break;
        }

        const [products, total] = await Promise.all([
            Product.find(query).sort(sort).limit(limitNum).skip(skip)
                .populate('sellerId', 'name businessName'),
            Product.countDocuments(query)
        ]);

        res.json({
            products,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Server error fetching products' });
    }
});

// ─── SINGLE PRODUCT ──────────────────────────────────────────────────────────

// Get single product by ID (public)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('sellerId', 'name businessName email phone');

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Increment view count without waiting
        Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

        res.json({ product });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error fetching product' });
    }
});

// ─── SELLER WRITE ROUTES ─────────────────────────────────────────────────────

// Create new product (seller only)
router.post('/', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const { name, category, price, originalPrice, discount, stock, description, images, features, tags, specifications } = req.body;

        if (!name || !category || price === undefined || stock === undefined || !description || !images || images.length === 0) {
            return res.status(400).json({ error: 'Required fields: name, category, price, stock, description, images' });
        }

        if (images.length > 5) {
            return res.status(400).json({ error: 'Maximum 5 product images allowed' });
        }

        const product = new Product({
            name, category, price, originalPrice, discount, stock,
            description, images, features, tags, specifications,
            sellerId: req.user.userId,
            status: 'active'
        });

        await product.save();
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Server error creating product' });
    }
});

// Update product (seller only, own products)
router.put('/:id', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.sellerId.toString() !== req.user.userId)
            return res.status(403).json({ error: 'Not authorized to update this product' });

        const fields = ['name', 'category', 'price', 'originalPrice', 'discount', 'stock', 'description', 'images', 'features', 'tags', 'status'];
        fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });

        await product.save();
        res.json({ message: 'Product updated successfully', product });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Server error updating product' });
    }
});

// Delete product — soft delete (seller only, own products)
router.delete('/:id', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.sellerId.toString() !== req.user.userId)
            return res.status(403).json({ error: 'Not authorized to delete this product' });

        product.status = 'inactive';
        await product.save();
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error deleting product' });
    }
});

// Update stock (seller only)
router.patch('/:id/stock', authenticateToken, checkRole(['seller']), async (req, res) => {
    try {
        const { stock } = req.body;
        if (stock === undefined || stock < 0) return res.status(400).json({ error: 'Invalid stock value' });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (product.sellerId.toString() !== req.user.userId)
            return res.status(403).json({ error: 'Not authorized' });

        product.stock = stock;
        await product.save();
        res.json({ message: 'Stock updated successfully', product });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ error: 'Server error updating stock' });
    }
});

module.exports = router;

/* ===================================
   DEMO DATA SEED SCRIPT
   Populates MongoDB with a realistic demo seller and 25 products
   Run: node scripts/seed.js
   =================================== */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User    = require('../backend/models/User');
const Product = require('../backend/models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/live-shopping';

// ─── Demo Seller ─────────────────────────────────────────────────────────────

const DEMO_SELLER = {
    name: 'BharatBazaar Store',
    email: 'demo-seller@bharatbazaar.com',
    phone: '9876543210',
    password: 'Demo@1234',
    role: 'seller',
    businessName: 'BharatBazaar Official Store',
    businessDescription: 'Your trusted marketplace for electronics, fashion, and more.',
    isActive: true
};

// ─── 25 Realistic Demo Products ──────────────────────────────────────────────

const PRODUCTS = [
    // ── Electronics ──────────────────────────────────────────────────────────
    {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'The ultimate Android flagship with Snapdragon 8 Gen 3, 200MP quad camera system, built-in S Pen, 6.8" Dynamic AMOLED display, and 5000mAh battery. Experience AI-powered photography and productivity at its finest.',
        category: 'electronics',
        price: 124999,
        originalPrice: 134999,
        discount: 7,
        stock: 25,
        images: [
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80',
            'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80'
        ],
        features: ['200MP Camera', 'S Pen Included', '5000mAh Battery', '12GB RAM', '256GB Storage'],
        tags: ['smartphone', 'samsung', 'android', 'flagship'],
        specifications: new Map([['Display', '6.8" Dynamic AMOLED 2X'], ['Processor', 'Snapdragon 8 Gen 3'], ['RAM', '12GB'], ['Storage', '256GB'], ['Battery', '5000mAh']]),
        rating: { average: 4.7, count: 1284 }
    },
    {
        name: 'Apple iPhone 15 Pro',
        description: 'Powered by the A17 Pro chip with 3nm technology. Features a titanium design, 48MP main camera with 4K ProRes video, Action Button, and USB-C. The most capable iPhone ever made.',
        category: 'electronics',
        price: 129900,
        originalPrice: 134900,
        discount: 4,
        stock: 18,
        images: [
            'https://images.unsplash.com/photo-1696426011282-7871db29ee7b?w=600&q=80',
            'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80'
        ],
        features: ['A17 Pro Chip', 'Titanium Design', '48MP Camera', 'USB-C', 'Action Button'],
        tags: ['iphone', 'apple', 'ios', 'smartphone'],
        specifications: new Map([['Chip', 'A17 Pro'], ['Display', '6.1" Super Retina XDR'], ['Camera', '48MP Main + 12MP Ultra Wide'], ['Storage', '128GB'], ['OS', 'iOS 17']]),
        rating: { average: 4.8, count: 2156 }
    },
    {
        name: 'Sony WH-1000XM5 Headphones',
        description: 'Industry-leading noise cancellation with 8 microphones and two processors. 30 hours battery life, crystal-clear hands-free calling, and multipoint connection. The gold standard in wireless headphones.',
        category: 'electronics',
        price: 26990,
        originalPrice: 34990,
        discount: 23,
        stock: 42,
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
            'https://images.unsplash.com/photo-1577174881658-0f30ed549adc?w=600&q=80'
        ],
        features: ['Industry-Leading ANC', '30hr Battery', '8 Microphones', 'Multipoint Connection', 'LDAC Support'],
        tags: ['headphones', 'sony', 'wireless', 'noise-cancelling'],
        specifications: new Map([['Driver', '30mm'], ['Frequency', '4Hz-40,000Hz'], ['Battery', '30 hours'], ['Connectivity', 'Bluetooth 5.2'], ['Weight', '250g']]),
        rating: { average: 4.6, count: 3421 }
    },
    {
        name: 'Apple MacBook Air M3',
        description: 'Supercharged by the M3 chip with 8-core CPU and 10-core GPU. Stunning 15.3" Liquid Retina display, up to 18 hours battery, and MagSafe charging. The thinnest, lightest MacBook Air ever.',
        category: 'electronics',
        price: 134900,
        originalPrice: 139900,
        discount: 4,
        stock: 12,
        images: [
            'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
            'https://images.unsplash.com/photo-1611186871525-8fa2e3a38c70?w=600&q=80'
        ],
        features: ['M3 Chip', '15.3" Liquid Retina', '18hr Battery', '8GB RAM', '256GB SSD'],
        tags: ['macbook', 'apple', 'laptop', 'm3'],
        specifications: new Map([['Chip', 'Apple M3'], ['RAM', '8GB'], ['Storage', '256GB SSD'], ['Display', '15.3" 2880×1864'], ['Battery', '18 hours']]),
        rating: { average: 4.9, count: 876 }
    },
    {
        name: 'Samsung 55" 4K QLED Smart TV',
        description: 'Quantum Dot technology delivers a billion shades of colour. Quantum HDR, Object Tracking Sound, and Alexa built-in. Transform your living room with cinema-grade picture quality.',
        category: 'electronics',
        price: 54990,
        originalPrice: 79990,
        discount: 31,
        stock: 8,
        images: [
            'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=80'
        ],
        features: ['4K QLED Panel', 'Quantum HDR', 'Object Tracking Sound', 'Alexa Built-in', 'Gaming Mode'],
        tags: ['tv', 'samsung', '4k', 'smart-tv'],
        specifications: new Map([['Screen Size', '55 inches'], ['Resolution', '4K (3840×2160)'], ['HDR', 'Quantum HDR'], ['Refresh Rate', '120Hz'], ['Smart Platform', 'Tizen']]),
        rating: { average: 4.4, count: 567 }
    },
    {
        name: 'boAt Airdopes 141 TWS Earbuds',
        description: 'ENx Technology for clear calls with environmental noise cancellation. BEAST Mode for ultra-low latency gaming, 42 hours total playtime, and IPX4 water resistance. Made for India.',
        category: 'electronics',
        price: 1299,
        originalPrice: 4490,
        discount: 71,
        stock: 150,
        images: [
            'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
            'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=600&q=80'
        ],
        features: ['ENx Technology', 'BEAST Mode Gaming', '42hr Playtime', 'IPX4 Water Resistant', 'Voice Assistant'],
        tags: ['earbuds', 'boat', 'tws', 'wireless'],
        specifications: new Map([['Driver', '8mm'], ['Battery', '42 hours total'], ['Connectivity', 'Bluetooth 5.3'], ['Water Resistance', 'IPX4'], ['Latency', '60ms Gaming Mode']]),
        rating: { average: 4.2, count: 18432 }
    },

    // ── Home & Kitchen ────────────────────────────────────────────────────────
    {
        name: 'Instant Pot Duo 7-in-1 Pressure Cooker',
        description: 'The world\'s favourite multi-cooker combines 7 appliances in one: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and warmer. 5.7L capacity for families of 4-6.',
        category: 'home',
        price: 8999,
        originalPrice: 12999,
        discount: 31,
        stock: 35,
        images: [
            'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80'
        ],
        features: ['7-in-1 Functions', '5.7L Capacity', '14 One-Touch Programs', 'Dishwasher Safe', '3 Cooking Temperatures'],
        tags: ['kitchen', 'pressure-cooker', 'instant-pot', 'cooking'],
        specifications: new Map([['Capacity', '5.7 Litres'], ['Power', '1000W'], ['Programs', '14 Smart Programs'], ['Material', 'Stainless Steel'], ['Warranty', '1 Year']]),
        rating: { average: 4.5, count: 2341 }
    },
    {
        name: 'Philips Air Fryer HD9200',
        description: 'Rapid Air Technology circulates hot air at high speed to fry food with up to 90% less fat. 4.1L family-size basket, digital display, 13 cooking presets, and dishwasher-safe parts.',
        category: 'home',
        price: 6995,
        originalPrice: 9995,
        discount: 30,
        stock: 48,
        images: [
            'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80'
        ],
        features: ['90% Less Fat', '4.1L Basket', '13 Presets', 'Digital Display', 'Dishwasher Safe'],
        tags: ['air-fryer', 'philips', 'kitchen', 'healthy-cooking'],
        specifications: new Map([['Capacity', '4.1 Litres'], ['Power', '1400W'], ['Temperature', '80-200°C'], ['Timer', 'Up to 60 min'], ['Warranty', '2 Years']]),
        rating: { average: 4.3, count: 1876 }
    },
    {
        name: 'Dyson V12 Detect Slim Vacuum',
        description: 'Laser Detect technology reveals microscopic dust on hard floors. Auto-mode intelligently adapts suction power. HEPA filtration captures 99.97% of particles. Lightweight at just 2.2kg.',
        category: 'home',
        price: 49900,
        originalPrice: 59900,
        discount: 17,
        stock: 15,
        images: [
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
        ],
        features: ['Laser Detect Technology', 'Auto-Mode', 'HEPA Filtration', '2.2kg Weight', '60min Runtime'],
        tags: ['vacuum', 'dyson', 'cordless', 'home-cleaning'],
        specifications: new Map([['Suction', '150 AW'], ['Weight', '2.2 kg'], ['Runtime', 'Up to 60 min'], ['Filtration', 'HEPA'], ['Bin Volume', '0.35L']]),
        rating: { average: 4.6, count: 743 }
    },

    // ── Fashion ───────────────────────────────────────────────────────────────
    {
        name: 'Levi\'s 511 Slim Fit Jeans',
        description: 'The original slim fit jean that sits below the waist with a slim through the thigh and leg. Made with Flex Jeans technology for comfort with every movement. Classic 5-pocket styling.',
        category: 'fashion',
        price: 2999,
        originalPrice: 4999,
        discount: 40,
        stock: 85,
        images: [
            'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80'
        ],
        features: ['Slim Fit', 'Flex Technology', 'Classic 5-Pocket', 'Machine Washable', 'Pure Cotton'],
        tags: ['jeans', 'levis', 'denim', 'men'],
        specifications: new Map([['Fit', 'Slim'], ['Material', '99% Cotton, 1% Elastane'], ['Rise', 'Mid Rise'], ['Wash', 'Machine Wash'], ['Origin', 'India']]),
        rating: { average: 4.3, count: 4521 }
    },
    {
        name: 'Allen Solly Women Formal Blazer',
        description: 'Sharp, structured blazer perfect for office or evening wear. Single-button closure, notched lapel, and two front pockets. Crafted from premium fabric blend for a refined, sophisticated look.',
        category: 'fashion',
        price: 2799,
        originalPrice: 4599,
        discount: 39,
        stock: 32,
        images: [
            'https://images.unsplash.com/photo-1594938298603-c8148c4b4cfe?w=600&q=80'
        ],
        features: ['Single Button Closure', 'Notched Lapel', 'Lined Interior', 'Dry Clean Only', 'Regular Fit'],
        tags: ['blazer', 'women', 'formal', 'office'],
        specifications: new Map([['Fit', 'Regular'], ['Material', 'Poly-Viscose Blend'], ['Closure', 'Single Button'], ['Care', 'Dry Clean'], ['Lining', 'Full Lining']]),
        rating: { average: 4.1, count: 892 }
    },
    {
        name: 'Nike Air Max 270 Sneakers',
        description: 'The first lifestyle Air Max shoe designed with Max Air unit in the heel for all-day cushioning. Mesh upper for breathability, foam midsole for lightweight comfort, and rubber outsole for durability.',
        category: 'fashion',
        price: 10995,
        originalPrice: 13995,
        discount: 21,
        stock: 55,
        images: [
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
            'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&q=80'
        ],
        features: ['Air Max Heel Unit', 'Mesh Upper', 'Foam Midsole', 'Rubber Outsole', 'Breathable'],
        tags: ['sneakers', 'nike', 'airmax', 'shoes'],
        specifications: new Map([['Upper', 'Engineered Mesh'], ['Midsole', 'Foam + Air Max'], ['Outsole', 'Rubber'], ['Closure', 'Lace Up'], ['Heel Height', '32mm Air Unit']]),
        rating: { average: 4.5, count: 3287 }
    },
    {
        name: 'Banarasi Silk Saree — Royal Blue',
        description: 'Exquisite handwoven Banarasi silk saree in royal blue with gold zari work. Traditional motifs and border design. Complete with matching blouse piece. Perfect for weddings and festive occasions.',
        category: 'fashion',
        price: 8999,
        originalPrice: 15999,
        discount: 44,
        stock: 20,
        images: [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&q=80'
        ],
        features: ['Pure Banarasi Silk', 'Gold Zari Work', 'Matching Blouse Piece', 'Handwoven', '5.5m Length'],
        tags: ['saree', 'banarasi', 'silk', 'ethnic', 'wedding'],
        specifications: new Map([['Fabric', 'Pure Banarasi Silk'], ['Length', '5.5 meters + 0.8m blouse'], ['Work', 'Gold Zari Weaving'], ['Occasion', 'Wedding/Festival'], ['Wash', 'Dry Clean']]),
        rating: { average: 4.7, count: 634 }
    },

    // ── Accessories ───────────────────────────────────────────────────────────
    {
        name: 'Fossil Gen 6 Smartwatch',
        description: 'Wear OS by Google powered smartwatch with Snapdragon Wear 4100+ chipset. Health tracking, Google Pay, Google Assistant, and 1.28" AMOLED display. 3ATM water resistance.',
        category: 'accessories',
        price: 19995,
        originalPrice: 24995,
        discount: 20,
        stock: 28,
        images: [
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
            'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80'
        ],
        features: ['Wear OS', 'AMOLED Display', 'Google Pay', 'Heart Rate Monitor', '3ATM Water Resistant'],
        tags: ['smartwatch', 'fossil', 'wearable', 'wear-os'],
        specifications: new Map([['OS', 'Wear OS by Google'], ['Display', '1.28" AMOLED'], ['Processor', 'Snapdragon Wear 4100+'], ['Battery', '24 hours'], ['Water Resistance', '3ATM']]),
        rating: { average: 4.2, count: 1543 }
    },
    {
        name: 'Ray-Ban Aviator Classic Sunglasses',
        description: 'The iconic aviator frame, born in 1937. Crystal green lenses with gold metal frame provide 100% UV protection. Timeless style that never goes out of fashion.',
        category: 'accessories',
        price: 9490,
        originalPrice: 12990,
        discount: 27,
        stock: 40,
        images: [
            'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80'
        ],
        features: ['100% UV Protection', 'Crystal Lenses', 'Metal Frame', 'Polarized Option', 'Case Included'],
        tags: ['sunglasses', 'rayban', 'aviator', 'accessories'],
        specifications: new Map([['Frame', 'Metal'], ['Lens', 'Crystal Green'], ['UV Protection', '100%'], ['Frame Size', '58mm'], ['Bridge', '14mm']]),
        rating: { average: 4.6, count: 2198 }
    },
    {
        name: 'Wildcraft Backpack 30L — Forest Green',
        description: '30L capacity hiking and travel backpack. Padded laptop compartment (fits up to 15.6"), ergonomic shoulder straps, rain cover included, multiple organiser pockets. Rugged 600D polyester.',
        category: 'accessories',
        price: 1799,
        originalPrice: 2999,
        discount: 40,
        stock: 67,
        images: [
            'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
            'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=600&q=80'
        ],
        features: ['30L Capacity', 'Laptop Compartment 15.6"', 'Rain Cover Included', 'Padded Straps', 'Multiple Pockets'],
        tags: ['backpack', 'wildcraft', 'travel', 'hiking'],
        specifications: new Map([['Capacity', '30 Litres'], ['Material', '600D Polyester'], ['Laptop Size', 'Up to 15.6"'], ['Weight', '0.85 kg'], ['Warranty', '1 Year']]),
        rating: { average: 4.2, count: 3456 }
    },
    {
        name: 'Leather Bi-fold Wallet — Tan Brown',
        description: 'Genuine full-grain leather bi-fold wallet. 8 card slots, 2 currency compartments, 1 ID window. RFID blocking technology protects your cards from electronic theft.',
        category: 'accessories',
        price: 799,
        originalPrice: 1499,
        discount: 47,
        stock: 120,
        images: [
            'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80'
        ],
        features: ['Full-Grain Leather', 'RFID Blocking', '8 Card Slots', 'ID Window', 'Slim Design'],
        tags: ['wallet', 'leather', 'rfid', 'accessories'],
        specifications: new Map([['Material', 'Full-Grain Leather'], ['Card Slots', '8'], ['Dimensions', '11.5×9.5cm'], ['RFID', 'Yes'], ['Closure', 'Bi-fold']]),
        rating: { average: 4.4, count: 7821 }
    },

    // ── Sports ────────────────────────────────────────────────────────────────
    {
        name: 'Decathlon Dumbbells Set 20kg',
        description: 'Hex rubber dumbbells in a set of 5 pairs (2kg, 4kg, 6kg, 8kg, 10kg) with a two-tier storage rack. Non-slip hex design prevents rolling. Ideal for home gym workouts.',
        category: 'sports',
        price: 4999,
        originalPrice: 7499,
        discount: 33,
        stock: 22,
        images: [
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80'
        ],
        features: ['5 Pairs', 'Hex Rubber Design', 'Storage Rack Included', 'Non-Slip Grip', '2-10kg Range'],
        tags: ['dumbbells', 'gym', 'fitness', 'strength-training'],
        specifications: new Map([['Set', '5 Pairs (2-10kg)'], ['Material', 'Rubber Coated Iron'], ['Design', 'Hex'], ['Storage Rack', 'Included'], ['Total Weight', '20kg']]),
        rating: { average: 4.3, count: 1234 }
    },
    {
        name: 'Adidas Ultraboost 23 Running Shoes',
        description: 'Engineered for runners who demand performance. Boost midsole delivers incredible energy return. Primeknit+ upper adapts to foot shape. Continental rubber outsole for exceptional grip in all conditions.',
        category: 'sports',
        price: 16999,
        originalPrice: 19999,
        discount: 15,
        stock: 38,
        images: [
            'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'
        ],
        features: ['Boost Midsole', 'Primeknit+ Upper', 'Continental Rubber Outsole', 'Linear Energy Push', 'Tailored Fibre Placement'],
        tags: ['running-shoes', 'adidas', 'ultraboost', 'sports'],
        specifications: new Map([['Upper', 'Primeknit+'], ['Midsole', 'Boost'], ['Outsole', 'Continental Rubber'], ['Drop', '10mm'], ['Weight', '310g (US 9)']]),
        rating: { average: 4.6, count: 2876 }
    },
    {
        name: 'Yonex Astrox 88S Badminton Racket',
        description: 'Used by top professionals. Head-heavy balance for powerful smashes. Graphite shaft with built-in T-anchor for superior torque. 3U weight class, 5U also available. Recommended for advanced players.',
        category: 'sports',
        price: 8490,
        originalPrice: 10990,
        discount: 23,
        stock: 18,
        images: [
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&q=80'
        ],
        features: ['Head-Heavy Balance', 'T-Anchor Technology', 'Isometric Frame', 'Graphite Shaft', 'Nanoflare Technology'],
        tags: ['badminton', 'yonex', 'racket', 'sports'],
        specifications: new Map([['Weight', '3U (85-89g)'], ['Balance', 'Head Heavy'], ['Flex', 'Stiff'], ['Frame', 'HM Graphite'], ['Length', '675mm']]),
        rating: { average: 4.5, count: 876 }
    },
    {
        name: 'Nivia Storm Football',
        description: 'FIFA Basic certified football for recreational play. PVC outer, foam backing for shape retention, latex bladder for consistent pressure. Size 5 standard, suitable for grass and artificial surfaces.',
        category: 'sports',
        price: 649,
        originalPrice: 999,
        discount: 35,
        stock: 200,
        images: [
            'https://images.unsplash.com/photo-1552318965-6e6be7484ada?w=600&q=80'
        ],
        features: ['FIFA Inspected', 'PVC Outer', 'Foam Backing', 'Latex Bladder', 'Machine Stitched'],
        tags: ['football', 'nivia', 'sports', 'outdoor'],
        specifications: new Map([['Size', 'Size 5'], ['Material', 'PVC'], ['Bladder', 'Latex'], ['Panels', '32'], ['Certification', 'FIFA Basic']]),
        rating: { average: 4.1, count: 5432 }
    },

    // ── Books ─────────────────────────────────────────────────────────────────
    {
        name: 'Atomic Habits — James Clear',
        description: 'The world\'s most popular book on behaviour change. Practical strategies to form good habits, break bad ones, and master the tiny behaviours that lead to remarkable results. Over 15 million copies sold.',
        category: 'books',
        price: 399,
        originalPrice: 599,
        discount: 33,
        stock: 300,
        images: [
            'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80'
        ],
        features: ['Bestseller', 'Practical Strategies', 'Scientific Research', 'Easy to Read', 'Life Changing'],
        tags: ['self-help', 'habits', 'productivity', 'james-clear'],
        specifications: new Map([['Author', 'James Clear'], ['Publisher', 'Penguin Random House'], ['Pages', '320'], ['Language', 'English'], ['Format', 'Paperback']]),
        rating: { average: 4.8, count: 24321 }
    },
    {
        name: 'The Psychology of Money — Morgan Housel',
        description: 'Timeless lessons on wealth, greed, and happiness. Morgan Housel explores the most important and least-understood aspect of personal finance: how we think about money. A must-read for investors.',
        category: 'books',
        price: 349,
        originalPrice: 499,
        discount: 30,
        stock: 250,
        images: [
            'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600&q=80'
        ],
        features: ['Finance Classic', '19 Short Stories', 'Timeless Wisdom', 'Easy Language', 'Global Bestseller'],
        tags: ['finance', 'money', 'investing', 'personal-finance'],
        specifications: new Map([['Author', 'Morgan Housel'], ['Publisher', 'Harriman House'], ['Pages', '256'], ['Language', 'English'], ['Format', 'Paperback']]),
        rating: { average: 4.7, count: 18765 }
    },

    // ── Other ─────────────────────────────────────────────────────────────────
    {
        name: 'LEGO Technic Land Rover Defender',
        description: 'The iconic 4×4 vehicle faithfully recreated in LEGO Technic. 2573 pieces, functional features including 4-speed gearbox, independent suspension, and a rear differential. For ages 11+.',
        category: 'toys',
        price: 12999,
        originalPrice: 16999,
        discount: 24,
        stock: 14,
        images: [
            'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&q=80'
        ],
        features: ['2573 Pieces', 'Functional Gearbox', 'Independent Suspension', 'Rear Differential', 'Detailed Interior'],
        tags: ['lego', 'technic', 'land-rover', 'building', 'toys'],
        specifications: new Map([['Pieces', '2573'], ['Age', '11+'], ['Dimensions', '28×42×19cm'], ['Difficulty', 'Expert'], ['Series', 'Technic']]),
        rating: { average: 4.8, count: 1243 }
    }
];

// ─── Main Seed Function ───────────────────────────────────────────────────────

async function seed() {
    console.log('\n🌱 BharatBazaar Demo Data Seed\n' + '─'.repeat(40));

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected:', mongoose.connection.name);

        // ── 1. Create / find demo seller ──────────────────────────────────────
        let seller = await User.findOne({ email: DEMO_SELLER.email });

        if (!seller) {
            const hashedPassword = await bcrypt.hash(DEMO_SELLER.password, 10);
            seller = await User.create({ ...DEMO_SELLER, password: hashedPassword });
            console.log('✅ Demo seller created:', seller.email);
        } else {
            console.log('ℹ️  Demo seller already exists:', seller.email);
        }

        // ── 2. Clear existing demo products ──────────────────────────────────
        const deleted = await Product.deleteMany({ sellerId: seller._id });
        if (deleted.deletedCount > 0) {
            console.log(`🗑️  Removed ${deleted.deletedCount} old demo products`);
        }

        // ── 3. Insert fresh products ──────────────────────────────────────────
        const productsToInsert = PRODUCTS.map(p => ({
            ...p,
            sellerId: seller._id,
            status: 'active'
        }));

        const inserted = await Product.insertMany(productsToInsert);
        console.log(`✅ Inserted ${inserted.length} demo products\n`);

        // ── 4. Summary ────────────────────────────────────────────────────────
        const categories = {};
        inserted.forEach(p => {
            categories[p.category] = (categories[p.category] || 0) + 1;
        });

        console.log('Product breakdown by category:');
        Object.entries(categories).forEach(([cat, count]) => {
            console.log(`  ${cat.padEnd(15)} ${count} products`);
        });

        const prices = inserted.map(p => p.price);
        console.log(`\nPrice range: ₹${Math.min(...prices).toLocaleString()} – ₹${Math.max(...prices).toLocaleString()}`);
        console.log('\n✅ Seed complete!\n');
        console.log('Demo seller credentials:');
        console.log(`  Email:    ${DEMO_SELLER.email}`);
        console.log(`  Password: ${DEMO_SELLER.password}`);
        console.log('\nNow run: node backend/server.js\n');

    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
}

seed();

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(() => console.log("Ket noi voi db thanh cong"))
.catch((err) => console.log("loi ket noi:",err));

const app = express();
app.use(cors());
app.use(express.json());

app.get('/',(req,res) => {
    res.send("Server Billiard is running");
});
const Product = require('./models/Product');
const Banner = require('./models/Banner');
const TrueSpliceLine = require('./models/TrueSpliceLine');
const P3Line = require('./models/P3Line');
const PoisonMaelith = require('./models/poisonMaelith');
const PoisonCandy = require('./models/PoisonCandy');
const CueCategory = require('./models/CueCategory');
const limitedEdition = require('./models/LimitedEdition');
const User = require('./models/User');
const Order = require('./models/Order');
const { ProductVariant, VariantOptions } = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');
const OrderHistory = require('./models/OrderHistory');

const ADMIN_LINE_MODELS = {
    truesplice: { model: TrueSpliceLine, label: 'True Splice' },
    p3: { model: P3Line, label: 'P3' },
    'poison-maelith': { model: PoisonMaelith, label: 'Poison Maelith' },
    'poison-candy': { model: PoisonCandy, label: 'Poison Candy' },
    limited: { model: limitedEdition, label: 'Limited Edition' }
};

const normalizeLineType = (value) => String(value || '').trim().toLowerCase();

const getAdminLineConfig = (lineType) => ADMIN_LINE_MODELS[normalizeLineType(lineType)] || null;

const mapAdminLineItem = (item, lineType) => {
    const plain = item.toObject ? item.toObject() : item;
    const fallbackImage = Array.isArray(plain.images) && plain.images.length > 0 ? plain.images[0] : '';

    return {
        ...plain,
        lineType,
        image: plain.image || fallbackImage,
        lineSeriesImage: plain.lineSeriesImage || '',
        price: Number(plain.price || 0),
        order: Number(plain.order || 0),
        isActive: plain.isActive !== false,
        images: Array.isArray(plain.images) ? plain.images : []
    };
};

const JWT_SECRET = process.env.JWT_SECRET || 'lab-billiard-dev-secret';
const SELLER_BANK_INFO = {
    bankCode: process.env.SELLER_BANK_CODE || 'TPB',
    bankName: process.env.SELLER_BANK_NAME || 'TPBank',
    accountNumber: process.env.SELLER_BANK_ACCOUNT_NUMBER || '04232073801',
    accountHolder: process.env.SELLER_BANK_ACCOUNT_HOLDER || 'CUNG QUOC DAT'
};

const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
});

const createAuthToken = (user) =>
    jwt.sign({ userId: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const payload = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(payload.userId);

        if (!user) {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        req.authUser = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid authentication token' });
    }
};

const requireAdmin = async (req, res, next) => {
    if (!req.authUser || req.authUser.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }

    return next();
};

app.post('/api/auth/register', async (req, res) => {
    try {
        const name = (req.body?.name || '').trim();
        const email = (req.body?.email || '').trim().toLowerCase();
        const password = req.body?.password || '';
        const hasAnyDigitInName = /\d/.test(name);

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        if (hasAnyDigitInName) {
            return res.status(400).json({ message: 'Name cannot contain numbers' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, passwordHash });
        const token = createAuthToken(user);

        return res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
        if (err?.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }

        return res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const email = (req.body?.email || '').trim().toLowerCase();
        const password = req.body?.password || '';

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const passwordMatched = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatched) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = createAuthToken(user);
        return res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
    return res.json({ user: sanitizeUser(req.authUser) });
});

app.get('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
    try {
        const lineTypes = Object.keys(ADMIN_LINE_MODELS);
        const collections = await Promise.all(
            lineTypes.map(async (lineType) => {
                const { model } = ADMIN_LINE_MODELS[lineType];
                const items = await model.find({}).sort({ order: 1, createdAt: -1 });
                return items.map((item) => mapAdminLineItem(item, lineType));
            })
        );

        const products = collections
            .flat()
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        return res.json({ products });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.post('/api/admin/products', requireAuth, requireAdmin, async (req, res) => {
    try {
        const lineType = normalizeLineType(req.body?.lineType);
        const lineConfig = getAdminLineConfig(lineType);

        if (!lineConfig) {
            return res.status(400).json({ message: 'lineType is invalid' });
        }

        const image = String(req.body?.image || '').trim();
        const images = Array.isArray(req.body?.images)
            ? req.body.images.map((item) => String(item || '').trim()).filter(Boolean)
            : [];

        const payload = {
            name: String(req.body?.name || '').trim(),
            price: Number(req.body?.price || 0),
            lineSeriesImage: String(req.body?.lineSeriesImage || '').trim(),
            currencySymbol: String(req.body?.currencySymbol || '$').trim() || '$',
            link: String(req.body?.link || '/').trim() || '/',
            isActive: Boolean(req.body?.isActive ?? true),
            order: Number(req.body?.order || 0)
        };

        if (!payload.name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        if (lineType === 'limited') {
            const mergedImages = images.length > 0 ? images : (image ? [image] : []);
            if (mergedImages.length === 0) {
                return res.status(400).json({ message: 'Image is required' });
            }

            payload.images = mergedImages;
        } else {
            if (!image) {
                return res.status(400).json({ message: 'Image is required' });
            }

            payload.image = image;
        }

        const product = await lineConfig.model.create(payload);
        return res.status(201).json({ product });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.put('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const lineType = normalizeLineType(req.body?.lineType);
        const lineConfig = getAdminLineConfig(lineType);

        if (!lineConfig) {
            return res.status(400).json({ message: 'lineType is invalid' });
        }

        const updates = {
            name: req.body?.name,
            lineSeriesImage: req.body?.lineSeriesImage,
            image: req.body?.image,
            images: req.body?.images,
            price: req.body?.price,
            currencySymbol: req.body?.currencySymbol,
            link: req.body?.link,
            isActive: req.body?.isActive,
            order: req.body?.order
        };

        Object.keys(updates).forEach((key) => {
            if (typeof updates[key] === 'undefined') {
                delete updates[key];
            }
        });

        if (typeof updates.price !== 'undefined') {
            updates.price = Number(updates.price || 0);
        }

        if (typeof updates.order !== 'undefined') {
            updates.order = Number(updates.order || 0);
        }

        if (typeof updates.isActive !== 'undefined') {
            updates.isActive = Boolean(updates.isActive);
        }

        if (lineType === 'limited') {
            const image = String(req.body?.image || '').trim();
            const images = Array.isArray(req.body?.images)
                ? req.body.images.map((item) => String(item || '').trim()).filter(Boolean)
                : [];

            if (images.length > 0) {
                updates.images = images;
            } else if (image) {
                updates.images = [image];
            }

            delete updates.image;
        }

        const product = await lineConfig.model.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!product) {
            return res.status(404).json({ message: 'Line item not found' });
        }

        return res.json({ product });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const lineType = normalizeLineType(req.query?.lineType || req.body?.lineType);
        const lineConfig = getAdminLineConfig(lineType);

        if (!lineConfig) {
            return res.status(400).json({ message: 'lineType is invalid' });
        }

        const product = await lineConfig.model.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Line item not found' });
        }

        return res.json({ message: 'Line item deleted' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        return res.json({ users: users.map(sanitizeUser) });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.put('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const updates = {};
        if (typeof req.body?.name !== 'undefined') {
            updates.name = String(req.body.name || '').trim();
        }
        if (typeof req.body?.role !== 'undefined') {
            updates.role = String(req.body.role || '').trim();
        }

        const allowedRoles = ['customer', 'admin'];
        if (updates.role && !allowedRoles.includes(updates.role)) {
            return res.status(400).json({ message: 'Role must be customer or admin' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ user: sanitizeUser(user) });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.get('/api/admin/orders', requireAuth, requireAdmin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'name email role').sort({ createdAt: -1 }).limit(300);
        return res.json({ orders });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.put('/api/admin/orders/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const nextStatus = String(req.body?.status || '').trim();
        const allowedStatuses = ['pending', 'processing', 'packing', 'shipped', 'in-transit', 'delivered', 'cancelled', 'returned'];

        if (!allowedStatuses.includes(nextStatus)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: nextStatus },
            { new: true, runValidators: true }
        ).populate('user', 'name email role');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        return res.json({ order });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.post('/api/orders', requireAuth, async (req, res) => {
    try {
        const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
        const shippingAddress = {
            fullName: String(req.body?.shippingAddress?.fullName || '').trim(),
            phone: String(req.body?.shippingAddress?.phone || '').trim(),
            addressLine1: String(req.body?.shippingAddress?.addressLine1 || '').trim(),
            city: String(req.body?.shippingAddress?.city || '').trim(),
            country: String(req.body?.shippingAddress?.country || '').trim(),
            postalCode: String(req.body?.shippingAddress?.postalCode || '').trim()
        };
        const payment = {
            method: String(req.body?.payment?.method || 'cod').trim(),
            bankName: String(req.body?.payment?.bankName || '').trim(),
            accountNumber: String(req.body?.payment?.accountNumber || '').trim(),
            accountHolder: String(req.body?.payment?.accountHolder || '').trim(),
            reference: String(req.body?.payment?.reference || '').trim()
        };

        if (rawItems.length === 0) {
            return res.status(400).json({ message: 'Order items are required' });
        }

        const shippingFields = Object.values(shippingAddress);
        if (shippingFields.some((field) => !field)) {
            return res.status(400).json({ message: 'Shipping address is required' });
        }

        if (payment.method === 'bank-account') {
            payment.method = 'bank-transfer';
        }

        const allowedMethods = ['cod', 'bank-transfer'];
        if (!allowedMethods.includes(payment.method)) {
            return res.status(400).json({ message: 'Payment method must be cod or bank-transfer' });
        }

        if (payment.method === 'bank-transfer') {
            payment.bankName = SELLER_BANK_INFO.bankName;
            payment.accountNumber = SELLER_BANK_INFO.accountNumber;
            payment.accountHolder = SELLER_BANK_INFO.accountHolder;
            payment.reference = payment.reference || `LAB-${Date.now()}`;
        } else {
            payment.bankName = '';
            payment.accountNumber = '';
            payment.accountHolder = '';
            payment.reference = '';
        }

        const items = rawItems.map((item) => ({
            itemId: String(item?.id || item?.itemId || '').trim(),
            name: String(item?.name || '').trim(),
            seriesTitle: String(item?.seriesTitle || '').trim(),
            image: String(item?.image || '').trim(),
            price: Number(item?.price || 0),
            quantity: Number(item?.quantity || 0)
        }));

        const hasInvalidItem = items.some((item) => !item.itemId || !item.name || item.price < 0 || item.quantity < 1);

        if (hasInvalidItem) {
            return res.status(400).json({ message: 'Order items are invalid' });
        }

        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const order = await Order.create({
            user: req.authUser._id,
            items,
            subtotal,
            shippingAddress,
            payment,
            currencySymbol: req.body?.currencySymbol || '$'
        });

        return res.status(201).json({ order });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.get('/api/orders/my', requireAuth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.authUser._id }).sort({ createdAt: -1 }).limit(50);
        return res.json({ orders });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.get('/api/products', async (req,res) => {
    try{
        const products = await Product.find({});
        res.json(products);
    } catch(err){
        res.status(500).json({message: err.message});
    }
});

app.get('/api/banners', async (req,res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/truesplice-lines', async (req, res) => {
    try {
        const trueSpliceLines = await TrueSpliceLine.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(trueSpliceLines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/p3-lines', async (req, res) => {
    try {
        const p3Lines = await P3Line.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(p3Lines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/poison-maeliths', async (req, res) => {
    try {
        const poisonMaeliths = await PoisonMaelith.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(poisonMaeliths);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }   
});

app.get('/api/limited-editions', async (req, res) => {
    try {
        const limitedEditions = await limitedEdition.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(limitedEditions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}); 

app.get('/api/poison-candies', async (req, res) => {
    try {
        const poisonCandies = await PoisonCandy.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(poisonCandies);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
app.get('/api/cue-categories', async (req, res) => {
    try {
        const cueCategories = await CueCategory.find({ type: 'cues', isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(cueCategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/table-categories', async (req, res) => {
    try {
        const tableCategories = await CueCategory.find({ type: 'tables', isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(tableCategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/shaft-categories', async (req, res) => {
    try {
        const shaftCategories = await CueCategory.find({ type: 'shafts', isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(shaftCategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/case-categories', async (req, res) => {
    try {
        const caseCategories = await CueCategory.find({ type: 'cases', isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(caseCategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/accessory-categories', async (req, res) => {
    try {
        const accessoryCategories = await CueCategory.find({ type: 'accessories', isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(accessoryCategories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ====================== PHASE 1: PRODUCT VARIANTS & INVENTORY ======================

// ProductVariant APIs
app.get('/api/admin/products/:productId/variants', requireAuth, requireAdmin, async (req, res) => {
    try {
        const variants = await ProductVariant.find({ productId: req.params.productId }).sort({ createdAt: -1 });
        return res.json({ variants });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.post('/api/admin/products/:productId/variants', requireAuth, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const payload = {
            productId: req.params.productId,
            sku: String(req.body?.sku || '').trim(),
            shaft: String(req.body?.shaft || '').trim(),
            joint: String(req.body?.joint || '').trim(),
            weight: String(req.body?.weight || '').trim(),
            wrap: String(req.body?.wrap || '').trim(),
            priceAdjustment: Number(req.body?.priceAdjustment || 0)
        };

        if (!payload.sku || !payload.shaft || !payload.joint || !payload.weight || !payload.wrap) {
            return res.status(400).json({ message: 'SKU, shaft, joint, weight and wrap are required' });
        }

        const existingSku = await ProductVariant.findOne({ sku: payload.sku });
        if (existingSku) {
            return res.status(409).json({ message: 'SKU already exists' });
        }

        const variant = await ProductVariant.create(payload);
        // Create inventory record for this variant
        await Inventory.create({ variantId: variant._id, productId: req.params.productId, quantity: 0 });

        return res.status(201).json({ variant });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.put('/api/admin/variants/:variantId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const updates = {};
        const allowedFields = ['sku', 'shaft', 'joint', 'weight', 'wrap', 'priceAdjustment', 'status'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (updates.sku) {
            const existingSku = await ProductVariant.findOne({ sku: updates.sku, _id: { $ne: req.params.variantId } });
            if (existingSku) {
                return res.status(409).json({ message: 'SKU already exists' });
            }
        }

        const variant = await ProductVariant.findByIdAndUpdate(req.params.variantId, updates, { new: true, runValidators: true });
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }

        return res.json({ variant });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.delete('/api/admin/variants/:variantId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const variant = await ProductVariant.findByIdAndDelete(req.params.variantId);
        if (!variant) {
            return res.status(404).json({ message: 'Variant not found' });
        }

        // Delete associated inventory
        await Inventory.deleteOne({ variantId: req.params.variantId });
        return res.json({ message: 'Variant deleted' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Inventory APIs
app.get('/api/admin/inventory', requireAuth, requireAdmin, async (req, res) => {
    try {
        const inventory = await Inventory.find({})
            .populate('variantId', 'sku shaft joint weight wrap')
            .populate('productId', 'name')
            .sort({ quantity: 1 });
        return res.json({ inventory });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.get('/api/admin/inventory/warnings', requireAuth, requireAdmin, async (req, res) => {
    try {
        const lowStockItems = await Inventory.find({ $expr: { $lt: ['$quantity', '$reorderLevel'] } })
            .populate('variantId', 'sku shaft joint weight wrap priceAdjustment')
            .populate('productId', 'name price')
            .sort({ quantity: 1 });
        return res.json({ warnings: lowStockItems });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.put('/api/admin/inventory/:variantId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const updates = {};
        if (typeof req.body?.quantity !== 'undefined') {
            updates.quantity = Math.max(0, Number(req.body.quantity || 0));
        }
        if (typeof req.body?.reorderLevel !== 'undefined') {
            updates.reorderLevel = Number(req.body.reorderLevel || 5);
        }
        if (typeof req.body?.location !== 'undefined') {
            updates.location = String(req.body.location || '').trim();
        }

        const inventory = await Inventory.findByIdAndUpdate(
            req.body?.inventoryId || req.params.variantId,
            updates,
            { new: true }
        ).populate('variantId', 'sku').populate('productId', 'name');

        if (!inventory) {
            return res.status(404).json({ message: 'Inventory not found' });
        }

        return res.json({ inventory });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ====================== PHASE 2: ORDER FULFILLMENT & TRACKING ======================

// OrderHistory APIs
app.get('/api/admin/orders/:orderId/history', requireAuth, requireAdmin, async (req, res) => {
    try {
        const history = await OrderHistory.find({ orderId: req.params.orderId })
            .populate('updatedBy', 'name email')
            .sort({ createdAt: 1 });
        return res.json({ history });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Update order with tracking & status
app.put('/api/admin/orders/:orderId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const statusChange = String(req.body?.status || '').trim();
        const allowedStatuses = ['pending', 'processing', 'packing', 'shipped', 'in-transit', 'delivered', 'cancelled', 'returned'];

        if (!allowedStatuses.includes(statusChange)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const updates = {
            status: statusChange,
            notes: String(req.body?.notes || '').trim(),
            assignedWarehouse: String(req.body?.assignedWarehouse || 'Main Warehouse').trim()
        };

        if (req.body?.tracking) {
            updates.tracking = {
                number: String(req.body.tracking?.number || '').trim(),
                carrier: String(req.body.tracking?.carrier || '').trim(),
                estimatedDelivery: req.body.tracking?.estimatedDelivery ? new Date(req.body.tracking.estimatedDelivery) : null,
                currentLocation: String(req.body.tracking?.currentLocation || '').trim()
            };
        }

        if (statusChange === 'delivered' && req.body?.tracking?.actualDelivery) {
            updates.tracking.actualDelivery = new Date(req.body.tracking.actualDelivery);
        }

        const order = await Order.findByIdAndUpdate(req.params.orderId, updates, { new: true, runValidators: true })
            .populate('user', 'name email')
            .populate('processedBy', 'name');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Create order history entry
        await OrderHistory.create({
            orderId: req.params.orderId,
            status: statusChange,
            reason: String(req.body?.reason || '').trim(),
            notes: String(req.body?.notes || '').trim(),
            updatedBy: req.authUser._id,
            trackingNumber: updates.tracking?.number || '',
            estimatedDelivery: updates.tracking?.estimatedDelivery,
            actualDelivery: updates.tracking?.actualDelivery,
            location: updates.tracking?.currentLocation || ''
        });

        return res.json({ order });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ====================== ANALYTICS & REPORTING ======================

// Revenue analytics
app.get('/api/admin/analytics/revenue', requireAuth, requireAdmin, async (req, res) => {
    try {
        const days = Number(req.query?.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const orders = await Order.find({
            createdAt: { $gte: startDate },
            status: { $nin: ['cancelled', 'returned'] }
        }).sort({ createdAt: 1 });

        const dailyRevenue = {};
        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0];
            dailyRevenue[date] = (dailyRevenue[date] || 0) + order.subtotal;
        });

        const totalRevenue = orders.reduce((sum, order) => sum + order.subtotal, 0);

        return res.json({
            totalRevenue,
            dailyRevenue,
            orderCount: orders.length,
            averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Top selling products
app.get('/api/admin/analytics/top-products', requireAuth, requireAdmin, async (req, res) => {
    try {
        const days = Number(req.query?.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const orders = await Order.find({
            createdAt: { $gte: startDate },
            status: { $nin: ['cancelled', 'returned'] }
        });

        const productSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                productSales[item.itemId] = {
                    name: item.name,
                    quantity: (productSales[item.itemId]?.quantity || 0) + item.quantity,
                    revenue: (productSales[item.itemId]?.revenue || 0) + (item.price * item.quantity)
                };
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return res.json({ topProducts });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`);
});

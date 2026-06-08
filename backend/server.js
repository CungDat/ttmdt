const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(() => console.log("Database connected successfully"))
.catch((err) => console.log("Connection error:",err));

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
const BreakJumpLine = require('./models/BreakJumpLine');
const CueCategory = require('./models/CueCategory');
const limitedEdition = require('./models/LimitedEdition');
const ShaftLine = require('./models/ShaftLine');
const CaseLine = require('./models/CaseLine');
const AccessoryLine = require('./models/AccessoryLine');
const TableLine = require('./models/TableLine');
const User = require('./models/User');
const Order = require('./models/Order');
const { ProductVariant, VariantOptions } = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');
const OrderHistory = require('./models/OrderHistory');
const createAdminVariantInventoryRouter = require('./routes/adminVariantInventoryRoutes');
const createPaymentRouter = require('./routes/paymentRoutes');
const createSearchRouter = require('./routes/searchRoutes');
const createUploadRouter = require('./routes/uploadRoutes');
const createVoucherRouter = require('./routes/voucherRoutes');
const Voucher = require('./models/Voucher');
const emailService = require('./services/emailService');
const { startAutoCancelScheduler } = require('./services/autoCancelScheduler');

const ADMIN_LINE_MODELS = {
    truesplice: { model: TrueSpliceLine, label: 'True Splice' },
    p3: { model: P3Line, label: 'P3' },
    'poison-maelith': { model: PoisonMaelith, label: 'Poison Maelith' },
    'poison-candy': { model: PoisonCandy, label: 'Poison Candy' },
    'break-jump': { model: BreakJumpLine, label: 'Break & Jump' },
    limited: { model: limitedEdition, label: 'Limited Edition' },
    shaft: { model: ShaftLine, label: 'Shafts' },
    'case': { model: CaseLine, label: 'Cases' },
    accessory: { model: AccessoryLine, label: 'Accessories' },
    table: { model: TableLine, label: 'Tables' }
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

const ORDER_WORKFLOW_STATUSES = ['pending', 'paid', 'packing', 'shipped', 'delivered', 'cancelled', 'returned'];

// Legacy fallback vouchers (replaced by DB Voucher)
const VOUCHER_CODES = {};

// Shipping zones: Inner HCM < $30, neighboring provinces < $50, others < $100
const SHIPPING_ZONES = [
    { keywords: ['hồ chí minh', 'ho chi minh', 'hcm', 'tp hcm', 'tp. hcm'], fee: 30, label: 'Inner HCM' },
    { keywords: ['bình dương', 'đồng nai', 'long an', 'tây ninh', 'bà rịa', 'vũng tàu'], fee: 50, label: 'Neighboring Provinces' },
    { keywords: ['đà nẵng', 'huế', 'quảng nam', 'quảng ngãi', 'bình định', 'khánh hòa', 'nha trang'], fee: 70, label: 'Central Region' },
    { keywords: ['hà nội', 'hải phòng', 'hải dương', 'bắc ninh', 'hưng yên', 'vĩnh phúc', 'thái nguyên'], fee: 80, label: 'Northern Region' }
];
const SHIPPING_DEFAULT_FEE = 100;

const calculateShippingFee = (city) => {
    const normalized = String(city || '').toLowerCase().trim();
    for (const zone of SHIPPING_ZONES) {
        if (zone.keywords.some(kw => normalized.includes(kw))) return zone.fee;
    }
    return SHIPPING_DEFAULT_FEE;
};

const getShippingZoneLabel = (city) => {
    const normalized = String(city || '').toLowerCase().trim();
    for (const zone of SHIPPING_ZONES) {
        if (zone.keywords.some(kw => normalized.includes(kw))) return zone.label;
    }
    return 'National';
};

// DB-based voucher apply (used for COD/Bank checkout)
const applyVoucherDB = async (code, subtotal, shippingFee, userId) => {
    if (!code) return { discount: 0, shippingFee, error: null, voucher: null };
    const voucher = await Voucher.findOne({ code: String(code).toUpperCase().trim() });
    if (!voucher) return { discount: 0, shippingFee, error: 'Voucher code does not exist', voucher: null };
    const validation = voucher.validateVoucher(userId, subtotal);
    if (!validation.valid) return { discount: 0, shippingFee, error: validation.error, voucher: null };
    const result = voucher.calculateDiscount(subtotal, shippingFee);
    return { ...result, error: null, voucher };
};

// Legacy sync applyVoucher kept for payment routes compatibility
const applyVoucher = (code, subtotal, shippingFee) => {
    const voucher = VOUCHER_CODES[String(code || '').toUpperCase().trim()];
    if (!voucher) return { discount: 0, shippingFee, error: 'Invalid voucher code' };
    return { discount: 0, shippingFee, error: null };
};
const LINE_TYPE_SKU_PREFIX = {
    truesplice: 'TS',
    p3: 'P3',
    'poison-maelith': 'PM',
    'poison-candy': 'PC',
    'break-jump': 'BJ',
    limited: 'LE'
};

const sanitizeSkuSegment = (value) => String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 16);

const buildDefaultVariantSku = (lineType, lineName, itemId) => {
    const prefix = LINE_TYPE_SKU_PREFIX[lineType] || 'SKU';
    const namePart = sanitizeSkuSegment(lineName).split('-').slice(0, 2).join('-') || 'ITEM';
    const idPart = String(itemId || '').slice(-6).toUpperCase();
    return `${prefix}-${namePart}-${idPart || '000000'}-STD`;
};

const toLineSlug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildLineItemLookup = async () => {
    const byId = new Map();
    const byName = new Map();
    const bySlug = new Map();

    for (const [lineType, config] of Object.entries(ADMIN_LINE_MODELS)) {
        const docs = await config.model.find({}, '_id name').lean();
        docs.forEach((doc) => {
            const id = String(doc._id);
            const name = String(doc.name || '').trim();
            const nameKey = name.toLowerCase();
            const slugKey = toLineSlug(name);

            const resolved = {
                productId: doc._id,
                lineType,
                lineName: name
            };

            byId.set(id, resolved);
            if (nameKey) {
                byName.set(nameKey, resolved);
            }
            if (slugKey) {
                bySlug.set(slugKey, resolved);
            }
        });
    }

    return { byId, byName, bySlug };
};

const resolveOrderItemProduct = (item, lookup) => {
    const itemId = String(item?.itemId || '').trim();
    const itemName = String(item?.name || '').trim();

    if (mongoose.Types.ObjectId.isValid(itemId)) {
        const hitById = lookup.byId.get(itemId);
        if (hitById) {
            return hitById;
        }
    }

    const nameKey = itemName.toLowerCase();
    if (nameKey) {
        const hitByName = lookup.byName.get(nameKey);
        if (hitByName) {
            return hitByName;
        }
    }

    const slugCandidates = [toLineSlug(itemId), toLineSlug(itemName)].filter(Boolean);
    for (const slugKey of slugCandidates) {
        const hitBySlug = lookup.bySlug.get(slugKey);
        if (hitBySlug) {
            return hitBySlug;
        }
    }

    return null;
};

const syncInventoryFromVariants = async () => {
    const variants = await ProductVariant.find({}, '_id productId lineType lineName').lean();
    if (variants.length === 0) {
        return { synced: 0 };
    }

    const ops = variants.map((variant) => ({
        updateOne: {
            filter: { variantId: variant._id },
            update: {
                $set: {
                    productId: variant.productId,
                    lineType: variant.lineType,
                    lineName: variant.lineName
                },
                $setOnInsert: {
                    quantity: 0,
                    reserved: 0,
                    reorderLevel: 5,
                    location: 'Main Warehouse'
                }
            },
            upsert: true
        }
    }));

    await Inventory.bulkWrite(ops, { ordered: false });
    return { synced: variants.length };
};

const findLineItemById = async (lineItemId, lineType) => {
    const normalizedType = normalizeLineType(lineType);

    if (normalizedType) {
        const config = getAdminLineConfig(normalizedType);
        if (!config) {
            return null;
        }

        const item = await config.model.findById(lineItemId);
        if (!item) {
            return null;
        }

        return {
            lineType: normalizedType,
            lineName: item.name,
            item
        };
    }

    for (const [type, config] of Object.entries(ADMIN_LINE_MODELS)) {
        const item = await config.model.findById(lineItemId);
        if (item) {
            return {
                lineType: type,
                lineName: item.name,
                item
            };
        }
    }

    return null;
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
    phone: user.phone || '',
    address: user.address || '',
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

// ─── USER PROFILE UPDATE ───
app.put('/api/auth/profile', requireAuth, async (req, res) => {
    try {
        const updates = {};
        if (typeof req.body?.name !== 'undefined') {
            const name = String(req.body.name || '').trim();
            if (/\d/.test(name)) {
                return res.status(400).json({ message: 'Name cannot contain numbers' });
            }
            updates.name = name;
        }
        if (typeof req.body?.phone !== 'undefined') {
            updates.phone = String(req.body.phone || '').trim();
        }
        if (typeof req.body?.address !== 'undefined') {
            updates.address = String(req.body.address || '').trim();
        }

        // Password change
        if (req.body?.currentPassword && req.body?.newPassword) {
            const passwordMatched = await bcrypt.compare(req.body.currentPassword, req.authUser.passwordHash);
            if (!passwordMatched) {
                return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
            }
            if (req.body.newPassword.length < 6) {
                return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
            }
            updates.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
        }

        const user = await User.findByIdAndUpdate(req.authUser._id, updates, { new: true, runValidators: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({ user: sanitizeUser(user) });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
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
        const allowedStatuses = ORDER_WORKFLOW_STATUSES;

        if (!allowedStatuses.includes(nextStatus)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const previousStatus = order.status;

        // When order transitions to 'paid', 'packing', or 'shipped', deduct actual stock
        if ((nextStatus === 'paid' || nextStatus === 'packing' || nextStatus === 'shipped') && 
            (previousStatus === 'pending' || previousStatus === 'processing')) {
            // Deduct from actual inventory quantity
            for (const item of order.items) {
                const inventoryDocs = await Inventory.find({ productId: item.productId }).sort({ quantity: -1 });
                let remaining = item.quantity;

                for (const inventoryDoc of inventoryDocs) {
                    if (remaining <= 0) break;
                    const deductQty = Math.min(inventoryDoc.reserved, remaining);
                    if (deductQty > 0) {
                        await Inventory.findByIdAndUpdate(
                            inventoryDoc._id,
                            { $inc: { quantity: -deductQty, reserved: -deductQty } },
                            { new: true }
                        );
                        remaining -= deductQty;
                    }
                }
            }
        }

        // When order is cancelled, release reserved stock
        if (nextStatus === 'cancelled' && previousStatus !== 'cancelled') {
            for (const item of order.items) {
                const inventoryDocs = await Inventory.find({ productId: item.productId });
                let remaining = item.quantity;

                for (const inventoryDoc of inventoryDocs) {
                    if (remaining <= 0) break;
                    const releaseQty = Math.min(inventoryDoc.reserved, remaining);
                    if (releaseQty > 0) {
                        await Inventory.findByIdAndUpdate(
                            inventoryDoc._id,
                            { $inc: { reserved: -releaseQty } },
                            { new: true }
                        );
                        remaining -= releaseQty;
                    }
                }
            }
        }

        // When order is returned, add stock back
        if (nextStatus === 'returned' && previousStatus !== 'returned') {
            for (const item of order.items) {
                const inventoryDocs = await Inventory.find({ productId: item.productId });
                let remaining = item.quantity;

                for (const inventoryDoc of inventoryDocs) {
                    if (remaining <= 0) break;
                    const addBackQty = Math.min(inventoryDoc.reserved, remaining);
                    if (addBackQty > 0) {
                        await Inventory.findByIdAndUpdate(
                            inventoryDoc._id,
                            { $inc: { quantity: addBackQty, reserved: -addBackQty } },
                            { new: true }
                        );
                        remaining -= addBackQty;
                    }
                }
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: nextStatus,
                $push: {
                    statusHistory: {
                        status: nextStatus,
                        updatedAt: new Date(),
                        updatedBy: req.authUser._id,
                        note: String(req.body?.note || '').trim()
                    }
                }
            },
            { new: true, runValidators: true }
        ).populate('user', 'name email role');

        // Gửi email theo trạng thái mới
        const customerEmail = updatedOrder?.user?.email;
        if (customerEmail && updatedOrder) {
            if (nextStatus === 'paid') {
                emailService.sendPaymentConfirmation(updatedOrder, customerEmail).catch(() => {});
            } else if (nextStatus === 'shipped') {
                emailService.sendShippingNotification(updatedOrder, customerEmail).catch(() => {});
            } else if (nextStatus === 'cancelled') {
                emailService.sendOrderCancellation(updatedOrder, customerEmail, 'Đơn hàng đã được hủy bởi admin').catch(() => {});
            }
        }

        return res.json({ order: updatedOrder });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Admin: Update order tracking, notes, warehouse (non-status fields)
app.put('/api/admin/orders/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const updateFields = {};

        // Update tracking info
        if (req.body.tracking) {
            updateFields['tracking.number'] = String(req.body.tracking.number || '').trim();
            updateFields['tracking.carrier'] = String(req.body.tracking.carrier || '').trim();
            updateFields['tracking.currentLocation'] = String(req.body.tracking.currentLocation || '').trim();
        }

        // Update notes
        if (req.body.notes !== undefined) {
            updateFields.notes = String(req.body.notes || '').trim();
        }

        // Update assigned warehouse
        if (req.body.assignedWarehouse !== undefined) {
            updateFields.assignedWarehouse = String(req.body.assignedWarehouse || 'Main Warehouse').trim();
        }

        // If status is also provided, handle it
        if (req.body.status && req.body.status !== order.status) {
            const nextStatus = String(req.body.status).trim();
            if (ORDER_WORKFLOW_STATUSES.includes(nextStatus)) {
                updateFields.status = nextStatus;
                updateFields.$push = {
                    statusHistory: {
                        status: nextStatus,
                        updatedAt: new Date(),
                        updatedBy: req.authUser._id,
                        note: String(req.body.statusNote || req.body.notes || '').trim()
                    }
                };
            }
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('user', 'name email role');

        return res.json({ order: updatedOrder });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Middleware xác thực tùy chọn (cho Guest Checkout)
const optionalAuth = async (req, res, next) => {
    try {
        const token = String(req.headers?.authorization || '').replace('Bearer ', '').trim();
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const user = await User.findById(decoded.id).select('-passwordHash');
            if (user) req.authUser = user;
        }
    } catch (_) { /* Guest mode */ }
    return next();
};

app.post('/api/orders', optionalAuth, async (req, res) => {
    try {
        const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
        const guestEmail = String(req.body?.guestEmail || req.body?.shippingAddress?.email || '').trim().toLowerCase();

        // Guest checkout: tạo tài khoản ẩn nếu chưa đăng nhập
        let orderUser = req.authUser;
        if (!orderUser) {
            if (!guestEmail) {
                return res.status(400).json({ message: 'Vui lòng nhập email để tiếp tục mua hàng' });
            }
            // Tìm hoặc tạo guest user theo email
            let guestUser = await User.findOne({ email: guestEmail });
            if (!guestUser) {
                const guestName = String(req.body?.shippingAddress?.fullName || 'Guest').trim();
                const tempPass = await bcrypt.hash(`guest_${Date.now()}`, 8);
                guestUser = await User.create({
                    name: guestName.replace(/\d/g, '').trim() || 'Guest',
                    email: guestEmail,
                    passwordHash: tempPass,
                    phone: String(req.body?.shippingAddress?.phone || '').trim(),
                    role: 'customer'
                });
            }
            orderUser = guestUser;
        }
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

        const allowedMethods = ['cod', 'bank-transfer', 'vnpay'];
        if (!allowedMethods.includes(payment.method)) {
            return res.status(400).json({ message: 'Payment method must be cod, bank-transfer, or vnpay' });
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

        await syncInventoryFromVariants();

        const lookup = await buildLineItemLookup();
        const resolvedItems = [];
        const requiredByProductId = new Map();

        for (const item of items) {
            const resolved = resolveOrderItemProduct(item, lookup);
            if (!resolved) {
                return res.status(400).json({ message: `Cannot resolve inventory item: ${item.name}` });
            }

            const productIdKey = String(resolved.productId);
            requiredByProductId.set(productIdKey, Number(requiredByProductId.get(productIdKey) || 0) + Number(item.quantity || 0));

            resolvedItems.push({
                ...item,
                productId: resolved.productId,
                lineType: resolved.lineType,
                lineName: resolved.lineName
            });
        }

        const inventoryDocs = await Inventory.find({
            productId: { $in: Array.from(requiredByProductId.keys()) }
        }).sort({ quantity: -1, createdAt: 1 });

        const inventoryByProductId = new Map();
        inventoryDocs.forEach((doc) => {
            const key = String(doc.productId);
            if (!inventoryByProductId.has(key)) {
                inventoryByProductId.set(key, []);
            }
            inventoryByProductId.get(key).push(doc);
        });

        const stockDeductions = [];
        for (const [productIdKey, requiredQty] of requiredByProductId.entries()) {
            const docs = inventoryByProductId.get(productIdKey) || [];
            const totalAvailable = docs.reduce((sum, doc) => sum + Math.max(0, Number(doc.quantity || 0) - Number(doc.reserved || 0)), 0);

            if (totalAvailable < requiredQty) {
                const fallbackName = resolvedItems.find((item) => String(item.productId) === productIdKey)?.name || productIdKey;
                return res.status(400).json({ message: `Not enough stock for ${fallbackName}. Available: ${totalAvailable}, required: ${requiredQty}` });
            }

            let remaining = requiredQty;
            for (const doc of docs) {
                if (remaining <= 0) {
                    break;
                }

                const available = Math.max(0, Number(doc.quantity || 0) - Number(doc.reserved || 0));
                if (available <= 0) {
                    continue;
                }

                const deductQty = Math.min(available, remaining);
                stockDeductions.push({ inventoryId: doc._id, quantity: deductQty });
                remaining -= deductQty;
            }
        }

        if (stockDeductions.length > 0) {
            await Inventory.bulkWrite(
                stockDeductions.map((entry) => ({
                    updateOne: {
                        filter: { _id: entry.inventoryId },
                        update: { $inc: { reserved: entry.quantity } }
                    }
                })),
                { ordered: true }
            );
        }

        const subtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        let shippingFee = calculateShippingFee(shippingAddress.city || shippingAddress.province);
        let discount = 0;
        const voucherCode = String(req.body?.voucherCode || '').trim();

        if (voucherCode) {
            const voucherResult = await applyVoucherDB(voucherCode, subtotal, shippingFee, orderUser?._id);
            if (!voucherResult.error) {
                discount = voucherResult.discount;
                shippingFee = voucherResult.shippingFee;
            }
        }

        const total = Math.max(0, subtotal + shippingFee - discount);

        const order = await Order.create({
            user: orderUser._id,
            items: resolvedItems,
            subtotal,
            shippingFee,
            discount,
            voucherCode,
            total,
            shippingAddress,
            payment,
            currencySymbol: req.body?.currencySymbol || '$',
            statusHistory: [{ status: 'pending', updatedAt: new Date(), note: 'Đơn hàng đã được tạo' }]
        });

        // Ghi nhận voucher đã dùng nếu có
        if (voucherCode && discount > 0) {
            const usedVoucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
            if (usedVoucher) await usedVoucher.markUsed(orderUser?._id).catch(() => {});
        }

        // Gửi email xác nhận cho khách
        const customerEmail = orderUser?.email || guestEmail;
        if (customerEmail) {
            emailService.sendOrderConfirmation(order, customerEmail).catch(() => {});
        }

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

// ─── PUBLIC: Lấy banner theo vị trí ───
app.get('/api/banners', async (req, res) => {
    try {
        const position = String(req.query?.position || '').trim();
        const filter = { isActive: true };
        if (position) filter.position = position;

        // Lọc theo ngày hiệu lực
        const now = new Date();
        filter.$and = [
            { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
            { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
        ];

        const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ─── ADMIN: Lấy TẤT CẢ banner (kể cả inactive) ───
app.get('/api/admin/banners', requireAuth, requireAdmin, async (req, res) => {
    try {
        const position = String(req.query?.position || '').trim();
        const filter = position ? { position } : {};
        const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });
        return res.json({ banners });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ─── ADMIN: Tạo banner mới ───
app.post('/api/admin/banners', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { title, subtitle, image, imageMobile, link, buttonText,
                position, seriesKey, overlayColor, textColor, order,
                startDate, endDate, isActive } = req.body;

        if (!title || !image) {
            return res.status(400).json({ message: 'Tiêu đề và ảnh là bắt buộc' });
        }

        const banner = await Banner.create({
            title: String(title).trim(),
            subtitle: String(subtitle || '').trim(),
            image: String(image).trim(),
            imageMobile: String(imageMobile || '').trim(),
            link: String(link || '/').trim(),
            buttonText: String(buttonText || '').trim(),
            position: position || 'hero',
            seriesKey: String(seriesKey || '').trim(),
            overlayColor: String(overlayColor || '').trim(),
            textColor: String(textColor || '#ffffff').trim(),
            order: Number(order || 0),
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            isActive: isActive !== false
        });

        return res.status(201).json({ banner });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ─── ADMIN: Cập nhật banner ───
app.put('/api/admin/banners/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });

        const fields = ['title', 'subtitle', 'image', 'imageMobile', 'link', 'buttonText',
                        'position', 'seriesKey', 'overlayColor', 'textColor', 'order', 'isActive'];

        for (const field of fields) {
            if (req.body[field] !== undefined) {
                banner[field] = req.body[field];
            }
        }
        if (req.body.startDate !== undefined) banner.startDate = req.body.startDate ? new Date(req.body.startDate) : null;
        if (req.body.endDate !== undefined) banner.endDate = req.body.endDate ? new Date(req.body.endDate) : null;

        await banner.save();
        return res.json({ banner });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ─── ADMIN: Xóa banner ───
app.delete('/api/admin/banners/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner không tồn tại' });
        return res.json({ message: 'Đã xóa banner thành công' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ─── ADMIN: Sắp xếp lại thứ tự banner (bulk reorder) ───
app.put('/api/admin/banners-reorder', requireAuth, requireAdmin, async (req, res) => {
    try {
        const items = Array.isArray(req.body?.items) ? req.body.items : [];
        if (items.length === 0) return res.status(400).json({ message: 'Danh sách items trống' });

        await Banner.bulkWrite(
            items.map((item, index) => ({
                updateOne: {
                    filter: { _id: item.id },
                    update: { $set: { order: index } }
                }
            }))
        );
        return res.json({ message: 'Đã cập nhật thứ tự banner' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
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

app.get('/api/break-jump-lines', async (req, res) => {
    try {
        const breakJumpLines = await BreakJumpLine.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(breakJumpLines);
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

app.get('/api/shaft-lines', async (req, res) => {
    try {
        const shaftLines = await ShaftLine.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(shaftLines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/case-lines', async (req, res) => {
    try {
        const caseLines = await CaseLine.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(caseLines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/accessory-lines', async (req, res) => {
    try {
        const accessoryLines = await AccessoryLine.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(accessoryLines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/table-lines', async (req, res) => {
    try {
        const tableLines = await TableLine.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(tableLines);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ====================== VOUCHER & SHIPPING API ======================

// DB-based voucher validate (thay thế hardcode cũ)
app.post('/api/voucher/validate', async (req, res) => {
    try {
        const code = String(req.body?.code || '').toUpperCase().trim();
        const subtotal = Number(req.body?.subtotal || 0);
        const city = String(req.body?.city || '').trim();
        const userId = req.authUser?._id || null;

        if (!code) return res.status(400).json({ valid: false, message: 'Vui lòng nhập mã giảm giá' });

        const shippingFee = calculateShippingFee(city);
        const result = await applyVoucherDB(code, subtotal, shippingFee, userId);

        if (result.error) {
            return res.status(400).json({ valid: false, message: result.error });
        }

        return res.json({
            valid: true,
            code,
            description: result.voucher?.description || '',
            discount: result.discount,
            shippingFee: result.shippingFee,
            finalTotal: Math.max(0, subtotal + result.shippingFee - result.discount)
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

app.post('/api/shipping/calculate', async (req, res) => {
    try {
        const city = String(req.body?.city || '').trim();
        const shippingFee = calculateShippingFee(city);
        const zoneLabel = getShippingZoneLabel(city);
        return res.json({ shippingFee, zoneLabel, currency: '$', zones: SHIPPING_ZONES });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ====================== CROSS-SELLING API ======================

app.get('/api/cross-sell', async (req, res) => {
    try {
        const category = String(req.query?.category || '').trim().toLowerCase();
        const excludeId = String(req.query?.excludeId || '').trim();
        const limit = Math.min(Number(req.query?.limit) || 6, 12);

        let suggestions = [];

        if (category === 'cue' || category === 'cues' || !category) {
            const [accessories, cases, shafts] = await Promise.all([
                AccessoryLine.find({ isActive: true }).sort({ order: 1 }).limit(3).lean(),
                CaseLine.find({ isActive: true }).sort({ order: 1 }).limit(2).lean(),
                ShaftLine.find({ isActive: true }).sort({ order: 1 }).limit(2).lean()
            ]);
            suggestions = [
                ...accessories.map(item => ({ ...item, suggestCategory: 'Accessories' })),
                ...cases.map(item => ({ ...item, suggestCategory: 'Cases' })),
                ...shafts.map(item => ({ ...item, suggestCategory: 'Shafts' }))
            ];
        } else if (category === 'shaft' || category === 'shafts') {
            const [accessories, cues] = await Promise.all([
                AccessoryLine.find({ isActive: true }).sort({ order: 1 }).limit(3).lean(),
                BreakJumpLine.find({ isActive: true }).sort({ order: 1 }).limit(2).lean()
            ]);
            suggestions = [
                ...accessories.map(item => ({ ...item, suggestCategory: 'Accessories' })),
                ...cues.map(item => ({ ...item, suggestCategory: 'Cues' }))
            ];
        } else {
            const [accessories, cases] = await Promise.all([
                AccessoryLine.find({ isActive: true }).sort({ order: 1 }).limit(4).lean(),
                CaseLine.find({ isActive: true }).sort({ order: 1 }).limit(3).lean()
            ]);
            suggestions = [
                ...accessories.map(item => ({ ...item, suggestCategory: 'Accessories' })),
                ...cases.map(item => ({ ...item, suggestCategory: 'Cases' }))
            ];
        }

        if (excludeId) {
            suggestions = suggestions.filter(item => String(item._id) !== excludeId);
        }

        return res.json({ suggestions: suggestions.slice(0, limit) });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Order history for customers
app.get('/api/orders/:orderId/history', requireAuth, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.orderId, user: req.authUser._id })
            .select('statusHistory status createdAt');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        return res.json({ statusHistory: order.statusHistory || [], currentStatus: order.status });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ====================== PHASE 1: PRODUCT VARIANTS & INVENTORY ======================
app.use('/api/admin', createAdminVariantInventoryRouter({
    requireAuth,
    requireAdmin,
    ProductVariant,
    Inventory,
    ADMIN_LINE_MODELS,
    normalizeLineType,
    findLineItemById,
    syncInventoryFromVariants,
    buildDefaultVariantSku
}));

// ─── PAYMENT GATEWAY (VNPAY) ───
app.use('/api/payment', createPaymentRouter({
    requireAuth,
    Order,
    Inventory,
    ADMIN_LINE_MODELS,
    buildLineItemLookup,
    resolveOrderItemProduct,
    syncInventoryFromVariants,
    calculateShippingFee,
    applyVoucherDB,
    Voucher,
    SELLER_BANK_INFO
}));

// ─── ADVANCED SEARCH & FILTER ───
app.use('/api/search', createSearchRouter({
    ADMIN_LINE_MODELS,
    Inventory,
    ProductVariant
}));

// ─── CLOUDINARY UPLOAD ───
app.use('/api/upload', createUploadRouter({
    requireAuth,
    requireAdmin
}));

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
        const allowedStatuses = ORDER_WORKFLOW_STATUSES;

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

app.get('/api/admin/analytics/kpis', requireAuth, requireAdmin, async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const todayOrders = await Order.find({
            createdAt: { $gte: todayStart },
            status: { $nin: ['cancelled', 'returned'] }
        });

        const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);

        const pendingOrderCount = await Order.countDocuments({
            status: { $in: ['pending', 'paid'] }
        });

        const monthOrders = await Order.find({
            createdAt: { $gte: monthStart },
            status: { $nin: ['cancelled', 'returned'] }
        });

        const monthlySales = {};
        monthOrders.forEach((order) => {
            order.items.forEach((item) => {
                monthlySales[item.itemId] = {
                    name: item.name,
                    quantity: (monthlySales[item.itemId]?.quantity || 0) + Number(item.quantity || 0),
                    revenue: (monthlySales[item.itemId]?.revenue || 0) + Number(item.price || 0) * Number(item.quantity || 0)
                };
            });
        });

        const topProduct = Object.values(monthlySales).sort((a, b) => b.quantity - a.quantity)[0] || null;

        const weeklyStart = new Date(todayStart);
        weeklyStart.setDate(todayStart.getDate() - 6);

        const weeklyOrders = await Order.find({
            createdAt: { $gte: weeklyStart },
            status: { $nin: ['cancelled', 'returned'] }
        }).sort({ createdAt: 1 });

        const weeklyRevenueMap = {};
        for (let i = 0; i < 7; i += 1) {
            const dateObj = new Date(weeklyStart);
            dateObj.setDate(weeklyStart.getDate() + i);
            const key = dateObj.toISOString().split('T')[0];
            weeklyRevenueMap[key] = 0;
        }

        weeklyOrders.forEach((order) => {
            const key = order.createdAt.toISOString().split('T')[0];
            if (weeklyRevenueMap[key] !== undefined) {
                weeklyRevenueMap[key] += Number(order.subtotal || 0);
            }
        });

        const weeklyRevenue = Object.entries(weeklyRevenueMap).map(([date, revenue]) => ({ date, revenue }));

        return res.json({
            todayRevenue,
            pendingOrderCount,
            topProduct,
            weeklyRevenue
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// ─── VOUCHER ADMIN & PUBLIC ROUTES ───
app.use('/api/vouchers', createVoucherRouter({ requireAuth, requireAdmin, Voucher }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Khởi động Auto-Cancel Scheduler sau khi server sẵn sàng
    startAutoCancelScheduler(Order, Inventory);
});

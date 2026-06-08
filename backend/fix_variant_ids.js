const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { ProductVariant } = require('./models/ProductVariant');
const Inventory = require('./models/Inventory');

// Line Models
const TrueSpliceLine = require('./models/TrueSpliceLine');
const P3Line = require('./models/P3Line');
const PoisonMaelith = require('./models/poisonMaelith');
const PoisonCandy = require('./models/PoisonCandy');
const BreakJumpLine = require('./models/BreakJumpLine');
const LimitedEdition = require('./models/LimitedEdition');
const ShaftLine = require('./models/ShaftLine');
const CaseLine = require('./models/CaseLine');
const AccessoryLine = require('./models/AccessoryLine');
const TableLine = require('./models/TableLine');

const ADMIN_LINE_MODELS = {
    truesplice: TrueSpliceLine,
    p3: P3Line,
    'poison-maelith': PoisonMaelith,
    'poison-candy': PoisonCandy,
    'break-jump': BreakJumpLine,
    limited: LimitedEdition,
    shaft: ShaftLine,
    'case': CaseLine,
    accessory: AccessoryLine,
    table: TableLine
};

async function fixVariantIds() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to DB');

    // Build lookup maps: Map<lineType, Map<name, id>>
    const lookupMaps = new Map();
    for (const [lineType, model] of Object.entries(ADMIN_LINE_MODELS)) {
        const docs = await model.find({}, '_id name').lean();
        const nameMap = new Map();
        docs.forEach(d => nameMap.set(String(d.name).trim(), d._id));
        lookupMaps.set(lineType, nameMap);
        console.log(`Loaded ${docs.length} items for ${lineType}`);
    }

    const variants = await ProductVariant.find().lean();
    console.log(`Checking ${variants.length} ProductVariants...`);

    let updatedCount = 0;
    for (const variant of variants) {
        const nameMap = lookupMaps.get(variant.lineType);
        if (!nameMap) {
            console.log(`- Warning: Unknown lineType "${variant.lineType}" for variant ${variant.sku}`);
            continue;
        }

        const currentId = nameMap.get(String(variant.lineName).trim());
        if (!currentId) {
            console.log(`- Warning: Line item "${variant.lineName}" not found in ${variant.lineType} collection for variant ${variant.sku}`);
            continue;
        }

        if (String(variant.productId) !== String(currentId)) {
            console.log(`- Updating variant ${variant.sku}: Old ProductID ${variant.productId} -> New ProductID ${currentId}`);
            await ProductVariant.updateOne({ _id: variant._id }, { $set: { productId: currentId } });
            updatedCount++;
        }
    }

    console.log(`Updated ${updatedCount} ProductVariants.`);

    // Now trigger inventory sync
    console.log('Triggering Inventory sync...');
    const syncResult = await syncInventory();
    console.log('Sync Result:', syncResult);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function syncInventory() {
    const variants = await ProductVariant.find({}, '_id productId lineType lineName').lean();
    if (variants.length === 0) return { synced: 0 };

    const ops = variants.map((variant) => ({
        updateOne: {
            filter: { variantId: variant._id },
            update: {
                $set: {
                    productId: variant.productId,
                    lineType: variant.lineType,
                    lineName: variant.lineName
                }
            },
            upsert: true
        }
    }));

    await Inventory.bulkWrite(ops, { ordered: false });
    return { synced: variants.length };
}

fixVariantIds();

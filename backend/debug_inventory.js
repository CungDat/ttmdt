const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Inventory = require('./models/Inventory');
const { ProductVariant } = require('./models/ProductVariant');
const TrueSpliceLine = require('./models/TrueSpliceLine');

async function debugInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to DB');

    const targetName = "Predator LE True Splice 16 Pool Cue - Ebony with Green/Yellow Points - Leather Wrap";
    
    console.log(`\n--- Searching for: "${targetName}" ---`);
    
    const trueSpliceDoc = await TrueSpliceLine.findOne({ name: targetName }).lean();
    if (trueSpliceDoc) {
        console.log(`TrueSpliceLine Doc ID: ${trueSpliceDoc._id}`);
    } else {
        console.log(`TrueSpliceLine Doc NOT FOUND by name.`);
    }

    const variants = await ProductVariant.find({ lineName: targetName }).lean();
    console.log(`ProductVariants found by lineName: ${variants.length}`);
    variants.forEach(v => {
        console.log(`- Variant ID: ${v._id}, productId: ${v.productId}, SKU: ${v.sku}`);
    });

    const invs = await Inventory.find({ lineName: targetName }).lean();
    console.log(`Inventory found by lineName: ${invs.length}`);
    invs.forEach(i => {
        console.log(`- Inventory ID: ${i._id}, productId: ${i.productId}, Qty: ${i.quantity}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugInventory();

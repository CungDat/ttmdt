const mongoose = require('mongoose');
const dotenv = require('dotenv');
const banners = require('./data/banners');
const trueSpliceLines = require('./data/trueSpliceLines');
const p3ProwlerCues = require('./data/p3ProwlerCues');
const p3FlareOrangeCues = require('./data/p3FlareOrangeCues');
const p3GalaxyCues = require('./data/p3GalaxyCues');
const p3BlackCues = require('./data/p3BlackCues');
const poisonMaelith = require('./data/poisonMaeliths');
const limitedEditions = require('./data/limitedEditions');
const bkRushBreakCues = require('./data/bkRushBreakCues');
const bkRushJumpBreakCues = require('./data/bkRushJumpBreakCues');
const poisonVxBreakJumpCues = require('./data/poisonVxBreakJumpCues');
const bk4BreakCues = require('./data/bk4BreakCues');
const airRushJumpCues = require('./data/airRushJumpCues');
const airIiJumpCues = require('./data/airIiJumpCues');
const cueCategories = require('./data/cueCategories');
const tableCategories = require('./data/tableCategories');
const shaftCategories = require('./data/shaftCategories');
const caseCategories = require('./data/caseCategories');
const accessoryCategories = require('./data/accessoryCategories');
const shaftLinesData = require('./data/shaftLines');
const caseLinesData = require('./data/caseLines');
const accessoryLinesData = require('./data/accessoryLines');
const tableLinesData = require('./data/tableLines');
const Banner = require('./models/Banner');
const TrueSpliceLine = require('./models/TrueSpliceLine');
const P3Line = require('./models/P3Line');
const PoisonMaelith = require('./models/poisonMaelith');
const poisonCandy = require('./data/poisonCandies');
const PoisonCandyModel = require('./models/PoisonCandy');
const BreakJumpLine = require('./models/BreakJumpLine');
const CueCategory = require('./models/CueCategory');
const LimitedEdition = require('./models/LimitedEdition');
const ShaftLine = require('./models/ShaftLine');
const CaseLine = require('./models/CaseLine');
const AccessoryLine = require('./models/AccessoryLine');
const TableLine = require('./models/TableLine');
dotenv.config();
mongoose.connect(process.env.MONGO_URL);

const importData = async () => {
    try {
        await Banner.deleteMany();
        await TrueSpliceLine.deleteMany();
        await P3Line.deleteMany();
        await PoisonCandyModel.deleteMany();
        await PoisonMaelith.deleteMany();
        await LimitedEdition.deleteMany();
        await BreakJumpLine.deleteMany();
        await CueCategory.deleteMany();
        await ShaftLine.deleteMany();
        await CaseLine.deleteMany();
        await AccessoryLine.deleteMany();
        await TableLine.deleteMany();
        await Banner.insertMany(banners);
        await TrueSpliceLine.insertMany(trueSpliceLines);
        const p3Lines = [...p3ProwlerCues, ...p3FlareOrangeCues, ...p3GalaxyCues, ...p3BlackCues];
        await P3Line.insertMany(p3Lines);
        await PoisonCandyModel.insertMany(poisonCandy);
        await PoisonMaelith.insertMany(poisonMaelith);
        await LimitedEdition.insertMany(limitedEditions);
        const breakJumpLines = [...bkRushBreakCues, ...bkRushJumpBreakCues, ...poisonVxBreakJumpCues, ...bk4BreakCues, ...airRushJumpCues, ...airIiJumpCues];
        await BreakJumpLine.insertMany(breakJumpLines);
        await ShaftLine.insertMany(shaftLinesData);
        await CaseLine.insertMany(caseLinesData);
        await AccessoryLine.insertMany(accessoryLinesData);
        await TableLine.insertMany(tableLinesData);
        await CueCategory.insertMany([
          ...cueCategories.map(cat => ({ ...cat, type: 'cues' })),
          ...tableCategories.map(cat => ({ ...cat, type: 'tables' })),
          ...shaftCategories.map(cat => ({ ...cat, type: 'shafts' })),
          ...caseCategories.map(cat => ({ ...cat, type: 'cases' })),
          ...accessoryCategories.map(cat => ({ ...cat, type: 'accessories' }))
        ]);
        console.log("Data imported successfully");
        console.log(`  Shafts: ${shaftLinesData.length}`);
        console.log(`  Cases: ${caseLinesData.length}`);
        console.log(`  Accessories: ${accessoryLinesData.length}`);
        console.log(`  Tables: ${tableLinesData.length}`);
        process.exit();
    }
    catch (err) {
        console.log("Error importing data:", err);
        process.exit(1);
    }
};

importData();
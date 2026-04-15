const mongoose = require('mongoose');
const dotenv = require('dotenv');
const banners = require('./data/banners');
const trueSpliceLines = require('./data/trueSpliceLines');
const p3Lines = require('./data/p3Lines');
const poisonMaelith = require('./data/poisonMaeliths');
const limitedEditions = require('./data/limitedEditions');
const cueCategories = require('./data/cueCategories');
const tableCategories = require('./data/tableCategories');
const shaftCategories = require('./data/shaftCategories');
const caseCategories = require('./data/caseCategories');
const accessoryCategories = require('./data/accessoryCategories');
const Banner = require('./models/Banner');
const TrueSpliceLine = require('./models/TrueSpliceLine');
const P3Line = require('./models/P3Line');
const PoisonMaelith = require('./models/poisonMaelith');
const poisonCandy = require('./data/poisonCandies');
const PoisonCandyModel = require('./models/PoisonCandy');
const CueCategory = require('./models/CueCategory');
const LimitedEdition = require('./models/LimitedEdition');
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
        await CueCategory.deleteMany();
        await Banner.insertMany(banners);
        await TrueSpliceLine.insertMany(trueSpliceLines);
        await P3Line.insertMany(p3Lines);
        await PoisonCandyModel.insertMany(poisonCandy);
        await PoisonMaelith.insertMany(poisonMaelith);
        await LimitedEdition.insertMany(limitedEditions);
        await CueCategory.insertMany([
          ...cueCategories.map(cat => ({ ...cat, type: 'cues' })),
          ...tableCategories.map(cat => ({ ...cat, type: 'tables' })),
          ...shaftCategories.map(cat => ({ ...cat, type: 'shafts' })),
          ...caseCategories.map(cat => ({ ...cat, type: 'cases' })),
          ...accessoryCategories.map(cat => ({ ...cat, type: 'accessories' }))
        ]);
        console.log("Data imported successfully");
        process.exit();
    }
    catch (err) {
        console.log("Error importing data:", err);
        process.exit(1);
    }
};

importData();
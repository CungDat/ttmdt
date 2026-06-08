const mongoose = require('mongoose');
const MONGO_URL = 'mongodb://localhost:27017/LabBilliard';

const VoucherSchema = new mongoose.Schema({}, { strict: false });
const Voucher = mongoose.model('Voucher', VoucherSchema, 'vouchers');

async function dump() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');
    const vouchers = await Voucher.find({}).lean();
    console.log(JSON.stringify(vouchers, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

dump();

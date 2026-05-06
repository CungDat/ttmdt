const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) => !/\d/.test((value || '').trim()),
        message: 'Name cannot contain numbers'
      }
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    role: { type: String, default: 'customer', enum: ['customer', 'admin'] }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);

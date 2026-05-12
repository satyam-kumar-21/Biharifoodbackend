const mongoose = require('mongoose');

const settingsSchema = mongoose.Schema(
  {
    isCodEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    isOnlinePaymentEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    logo: {
      type: String,
    },
    address: {
      type: String,
      default: 'Bihar, India',
    },
    email: {
      type: String,
      default: 'contact@swadbihar.com',
    },
    phone: {
      type: String,
      default: '+91 0000000000',
    },
    // Add more settings here as needed (e.g., shipping rates, tax rates)
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;

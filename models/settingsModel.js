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
    authMode: {
      type: String,
      enum: ['mobile_otp', 'mobile_password', 'email_password_otp'],
      default: 'email_password_otp',
    },
    freeShippingThreshold: {
      type: Number,
      default: 500,
    },
    // Add more settings here as needed (e.g., shipping rates, tax rates)
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;

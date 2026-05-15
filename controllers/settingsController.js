const asyncHandler = require('express-async-handler');
const Settings = require('../models/settingsModel');

// @desc    Get settings
// @route   GET /api/settings
// @access  Public
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await Settings.create({
      isCodEnabled: true,
      isOnlinePaymentEnabled: true,
      authMode: 'email_password_otp',
    });
  }
  
  res.json(settings);
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = asyncHandler(async (req, res) => {
  const { isCodEnabled, isOnlinePaymentEnabled, logo, address, email, phone, authMode, freeShippingThreshold } = req.body;
  
  let settings = await Settings.findOne();
  
  if (settings) {
    settings.isCodEnabled = isCodEnabled !== undefined ? isCodEnabled : settings.isCodEnabled;
    settings.isOnlinePaymentEnabled = isOnlinePaymentEnabled !== undefined ? isOnlinePaymentEnabled : settings.isOnlinePaymentEnabled;
    settings.logo = logo !== undefined ? logo : settings.logo;
    settings.address = address !== undefined ? address : settings.address;
    settings.email = email !== undefined ? email : settings.email;
    settings.phone = phone !== undefined ? phone : settings.phone;
    settings.authMode = authMode !== undefined ? authMode : settings.authMode;
    settings.freeShippingThreshold = freeShippingThreshold !== undefined ? freeShippingThreshold : settings.freeShippingThreshold;
    
    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } else {
    const newSettings = await Settings.create({
      isCodEnabled,
      isOnlinePaymentEnabled,
      logo,
      address,
      email,
      phone,
      authMode,
      freeShippingThreshold,
    });
    res.json(newSettings);
  }
});

module.exports = {
  getSettings,
  updateSettings,
};

const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const generateToken = require('../utils/generateToken');
const { sendMsg91Otp, verifyMsg91Otp } = require('../utils/msg91');
const { sendOtpEmail } = require('../utils/sendEmail');
const { generateOtp, saveOtp, verifyOtp } = require('../utils/otpStore');

/**
 * Utility to get current auth mode from settings
 */
const getAuthMode = async () => {
  const settings = await Settings.findOne();
  return settings ? settings.authMode : 'mobile_otp';
};

// ─────────────────────────────────────────────────────────────────
// @desc    Send OTP to phone or email
// @route   POST /api/users/send-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────
const sendOtpHandler = asyncHandler(async (req, res) => {
  const { phone, email, name, purpose } = req.body;
  const authMode = await getAuthMode();

  // If purpose is forgot-password, always use the provided field
  if (purpose === 'forgot-password') {
    if (email) {
      const user = await User.findOne({ email });
      if (!user) { res.status(404); throw new Error('User not found with this email'); }
      const otp = generateOtp();
      saveOtp(email.toLowerCase(), otp);

      console.log('========================================');
      console.log(`🔑 RESET OTP for ${email} : ${otp}`);
      console.log('========================================');

      await sendOtpEmail(email, otp, user.name);
      return res.json({ message: 'Reset OTP sent to your email' });
    }
    // Mobile forgot password could be added later if needed
    res.status(400); throw new Error('Email is required for password reset');
  }

  // Normal Signup OTP
  if (authMode === 'mobile_otp' || authMode === 'mobile_password') {
    if (!phone) { res.status(400); throw new Error('Phone number is required'); }
    await sendMsg91Otp(phone);
    res.json({ message: 'OTP sent successfully to your mobile' });
  } 
  else if (authMode === 'email_password_otp') {
    if (!email) { res.status(400); throw new Error('Email is required'); }
    const otp = generateOtp();
    saveOtp(email.toLowerCase(), otp);
    
    console.log('========================================');
    console.log(`📧 EMAIL OTP for ${email} : ${otp}`);
    console.log('========================================');

    await sendOtpEmail(email, otp, name || '');
    res.json({ message: 'OTP sent to your email' });
  }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Verify OTP and register/login user
// @route   POST /api/users/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────
const verifyOtpHandler = asyncHandler(async (req, res) => {
  const { phone, email, otp, name, password, purpose } = req.body;
  const authMode = await getAuthMode();

  // Handle Password Reset verification
  if (purpose === 'forgot-password') {
    const result = verifyOtp(email.toLowerCase(), otp);
    if (!result.valid) { res.status(400); throw new Error(result.reason); }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) { res.status(404); throw new Error('User not found'); }
    
    if (password) {
      user.password = password;
      await user.save();
      return res.json({ message: 'Password reset successful. You can now login.' });
    }
    return res.json({ message: 'OTP verified. Now set your new password.' });
  }

  // Handle Signup Verification
  try {
    if (authMode === 'mobile_otp') {
      await verifyMsg91Otp(phone, otp);
      const normalizedPhone = phone.trim();
      let user = await User.findOne({ phone: normalizedPhone });

      if (user) {
        if (user.isBlocked) { res.status(401); throw new Error('Account blocked'); }
        generateToken(res, user._id);
        return res.json({ _id: user._id, name: user.name, phone: user.phone, isAdmin: user.isAdmin });
      } else {
        if (!name) { res.status(400); throw new Error('Name is required'); }
        user = await User.create({ name, phone: normalizedPhone, isVerified: true });
        generateToken(res, user._id);
        return res.status(201).json({ _id: user._id, name: user.name, phone: user.phone, isAdmin: user.isAdmin });
      }
    } 
    
    if (authMode === 'email_password_otp') {
      const result = verifyOtp(email.toLowerCase(), otp);
      if (!result.valid) { res.status(400); throw new Error(result.reason); }

      let user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        generateToken(res, user._id);
        return res.json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
      } else {
        if (!name || !password) { res.status(400); throw new Error('Name and password are required'); }
        user = await User.create({ name, email: email.toLowerCase(), password, isVerified: true });
        generateToken(res, user._id);
        return res.status(201).json({ _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
      }
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message || 'Invalid OTP');
  }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Standard Registration (for password modes)
// @route   POST /api/users
// @access  Public
// ─────────────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const authMode = await getAuthMode();

  if (authMode === 'mobile_password') {
    if (!name || !phone || !password) { res.status(400); throw new Error('Name, phone and password are required'); }
    const userExists = await User.findOne({ phone });
    if (userExists) { res.status(400); throw new Error('User already exists'); }
    const user = await User.create({ name, phone, password, isVerified: true });
    generateToken(res, user._id);
    return res.status(201).json({ _id: user._id, name: user.name, phone: user.phone, isAdmin: user.isAdmin });
  }

  // For email_password_otp, we usually go through send-otp -> verify-otp
  // But we can add direct registration if needed. 
  // For now, let's stick to the user's request: Signup uses OTP for email.
});

// ─────────────────────────────────────────────────────────────────
// @desc    Auth user & get token (Dynamic Login)
// @route   POST /api/users/login
// @access  Public
// ─────────────────────────────────────────────────────────────────
const authUser = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  const authMode = await getAuthMode();

  let user;
  if (authMode === 'mobile_password') {
    if (!phone || !password) { res.status(400); throw new Error('Phone and password are required'); }
    user = await User.findOne({ phone });
  } else if (authMode === 'email_password_otp') {
    if (!email || !password) { res.status(400); throw new Error('Email and password are required'); }
    user = await User.findOne({ email });
  } else {
    // mobile_otp login is handled by verify-otp
    res.status(400); throw new Error('Please use OTP login for this mode');
  }

  if (user && (await user.matchPassword(password))) {
    if (user.isBlocked) { res.status(401); throw new Error('Account blocked'); }
    generateToken(res, user._id);
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Logout user / clear cookie
// ─────────────────────────────────────────────────────────────────
const logoutUser = (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: 'Logged out successfully' });
};

// ─────────────────────────────────────────────────────────────────
// @desc    Get user profile
// ─────────────────────────────────────────────────────────────────
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, isAdmin: user.isAdmin });
  } else {
    res.status(404); throw new Error('User not found');
  }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Update user profile
// ─────────────────────────────────────────────────────────────────
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    if (req.body.password) user.password = req.body.password;
    const updatedUser = await user.save();
    res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, isAdmin: updatedUser.isAdmin });
  } else {
    res.status(404); throw new Error('User not found');
  }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Admin: Get all users
// ─────────────────────────────────────────────────────────────────
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

// ─────────────────────────────────────────────────────────────────
// @desc    Admin: Delete user
// ─────────────────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user && !user.isAdmin) {
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'User removed' });
  } else {
    res.status(404); throw new Error('User not found or is Admin');
  }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Admin: Get user by ID
// ─────────────────────────────────────────────────────────────────
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (user) { res.json(user); } else { res.status(404); throw new Error('User not found'); }
});

// ─────────────────────────────────────────────────────────────────
// @desc    Admin: Update user
// ─────────────────────────────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.isAdmin = Boolean(req.body.isAdmin);
    user.isBlocked = Boolean(req.body.isBlocked);
    const updatedUser = await user.save();
    res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, isAdmin: updatedUser.isAdmin, isBlocked: updatedUser.isBlocked });
  } else {
    res.status(404); throw new Error('User not found');
  }
});

module.exports = {
  authUser,
  registerUser,
  sendOtpHandler,
  verifyOtpHandler,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
};

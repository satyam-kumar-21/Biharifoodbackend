const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser); // Standard registration
router.post('/login', authUser); // Standard login
router.post('/send-otp', sendOtpHandler);
router.post('/verify-otp', verifyOtpHandler);
router.post('/logout', logoutUser);

// Profile
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Admin user management
router.route('/')
  .get(protect, admin, getUsers);

router.route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;

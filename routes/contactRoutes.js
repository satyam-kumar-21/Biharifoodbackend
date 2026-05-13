const express = require('express');
const router = express.Router();
const {
  createContact,
  getContacts,
  markContactAsRead,
  deleteContact,
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(createContact).get(protect, admin, getContacts);
router.route('/:id').delete(protect, admin, deleteContact);
router.route('/:id/read').put(protect, admin, markContactAsRead);

module.exports = router;

const express = require('express');
const router = express.Router();
const { calculateShippingRate } = require('../controllers/shippingController');

router.post('/calculate', calculateShippingRate);

module.exports = router;

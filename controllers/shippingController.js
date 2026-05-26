const axios = require('axios');
const asyncHandler = require('express-async-handler');

const getShiprocketToken = async () => {
  try {
    const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });
    return response.data.token;
  } catch (error) {
    console.error('Shiprocket Auth Error:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Shiprocket');
  }
};

// @desc    Calculate shipping rate
// @route   POST /api/shipping/calculate
// @access  Public
const calculateShippingRate = asyncHandler(async (req, res) => {
  const { destination_pincode, weight, cod } = req.body;
  const pickup_pincode = '843302';

  if (!destination_pincode) {
    res.status(400);
    throw new Error('Destination pincode is required');
  }

  try {
    // If we don't have credentials, we can't call Shiprocket
    if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
        return res.json({
            rate: 0,
            courier_name: 'Standard Delivery',
            estimated_delivery: '3-5 Days',
            isFallback: true
        });
    }

    const token = await getShiprocketToken();
    const response = await axios.get('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', {
      params: {
        pickup_postcode: pickup_pincode,
        delivery_postcode: destination_pincode,
        weight: weight || 0.5, // weight in kg
        cod: cod ? 1 : 0,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.status === 200) {
      const availableCouriers = response.data.data.available_courier_companies;
      if (availableCouriers.length > 0) {
        // Pick the first one (usually recommended)
        const recommended = availableCouriers[0];
        res.json({
          rate: recommended.rate,
          courier_name: recommended.courier_name,
          estimated_delivery: recommended.etd,
        });
      } else {
        res.status(400).json({ message: 'No courier services available for this location' });
      }
    } else {
      res.status(400).json({ message: 'Shiprocket serviceability check failed' });
    }
  } catch (error) {
    console.error('Shiprocket Rate Error:', error.response?.data || error.message);
    // Return fallback for now so the app doesn't break
    res.json({
        rate: 40,
        courier_name: 'Standard Delivery',
        estimated_delivery: '3-5 Days',
        isFallback: true
    });
  }
});

module.exports = {
  calculateShippingRate,
};

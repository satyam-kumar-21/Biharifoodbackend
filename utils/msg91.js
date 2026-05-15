const axios = require('axios');
const { saveOtp, verifyOtp } = require('./otpStore');



/**
 * Send OTP using MSG91
 * @param {string} mobile - 10-digit mobile number
 * @returns {Promise<object>} - MSG91 response
 */
const sendMsg91Otp = async (mobile) => {
  const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
  const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID;

  if (!MSG91_AUTH_KEY || !MSG91_TEMPLATE_ID) {
    throw new Error('MSG91 credentials are not configured in backend .env');
  }

  // MSG91 requires country code for international, but typically 91 is used for India if not specified or passed explicitly
  // We'll assume the mobile number passed is already prefixed with country code or we pass it as '91' + mobile.
  // The API uses mobile parameter like 919876543210
  const mobileWithCode = mobile.startsWith('91') || mobile.startsWith('+91') 
    ? mobile.replace('+', '') 
    : `91${mobile}`;

  // Generate OTP manually so we can log it for development/testing
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('\n========================================');
  console.log(`🔑 MSG91 OTP for ${mobileWithCode} : ${generatedOtp}`);
  console.log('========================================\n');

  // Save to local store for verification fallback
  saveOtp(mobileWithCode, generatedOtp);

  const url = `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=${mobileWithCode}&otp=${generatedOtp}`;

  try {
    const response = await axios.post(url, {}, {
      headers: {
        'authkey': MSG91_AUTH_KEY,
        'content-type': 'application/json'
      }
    });
    if (response.data.type === 'error') {
      throw new Error(response.data.message || 'Failed to send OTP via MSG91');
    }
    return response.data;
  } catch (error) {
    console.error('MSG91 Send OTP Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to send OTP via MSG91');
  }
};

/**
 * Verify OTP using MSG91
 * @param {string} mobile - 10-digit mobile number
 * @param {string} otp - OTP to verify
 * @returns {Promise<object>} - MSG91 response
 */
const verifyMsg91Otp = async (mobile, otp) => {
  const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;

  if (!MSG91_AUTH_KEY) {
    throw new Error('MSG91 credentials are not configured in backend .env');
  }

  const mobileWithCode = mobile.startsWith('91') || mobile.startsWith('+91') 
    ? mobile.replace('+', '') 
    : `91${mobile}`;

  const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${mobileWithCode}`;

  try {
    // 1. Try local verification first (for console logged OTPs)
    const localResult = verifyOtp(mobileWithCode, otp);
    if (localResult.valid) {
      return { message: 'OTP verified locally' };
    }

    // 2. Fallback to MSG91 verification
    const response = await axios.get(url, {
      headers: {
        'authkey': MSG91_AUTH_KEY
      }
    });
    if (response.data.type === 'error') {
      throw new Error(response.data.message || 'Invalid OTP');
    }
    return response.data;
  } catch (error) {
    console.error('MSG91 Verify OTP Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Invalid OTP');
  }
};

module.exports = {
  sendMsg91Otp,
  verifyMsg91Otp
};

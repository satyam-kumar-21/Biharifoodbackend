// In-memory OTP store — valid for 5 minutes
// Key: email or phone, Value: { otp, expiresAt }
const otpMap = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOtp = (identifier, otp) => {
  otpMap.set(identifier, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
  });
};

const verifyOtp = (identifier, otp) => {
  const record = otpMap.get(identifier);
  if (!record) return { valid: false, reason: 'OTP not found. Please request a new one.' };
  if (Date.now() > record.expiresAt) {
    otpMap.delete(identifier);
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }
  if (record.otp !== otp) return { valid: false, reason: 'Invalid OTP. Please try again.' };
  otpMap.delete(identifier); // one-time use
  return { valid: true };
};

module.exports = { generateOtp, saveOtp, verifyOtp };

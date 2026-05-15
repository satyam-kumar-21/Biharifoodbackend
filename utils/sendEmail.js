const nodemailer = require('nodemailer');

const sendOtpEmail = async (toEmail, otp, userName = '') => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_LOGIN,
      pass: process.env.BREVO_SMTP_KEY,
    },
  });

  const mailOptions = {
    from: `"Bihar Wala Taste" <biharwalataste@outlook.com>`,
    to: toEmail,
    subject: 'Your OTP for Bihar Wala Taste',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #e05c1b, #f7931e); padding: 32px 24px; text-align: center; }
          .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
          .body { padding: 32px 24px; text-align: center; }
          .otp-box { display: inline-block; font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #e05c1b; background: #fff7f0; border: 2px dashed #e05c1b; border-radius: 12px; padding: 20px 32px; margin: 24px 0; }
          .note { font-size: 13px; color: #888; margin-top: 16px; }
          .footer { background: #f4f4f4; padding: 16px 24px; text-align: center; font-size: 12px; color: #aaa; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍛 Bihar Wala Taste</h1>
          </div>
          <div class="body">
            <p style="font-size:16px; color:#333;">Hello${userName ? ' ' + userName : ''}! 👋</p>
            <p style="color:#555;">Your One-Time Password for account verification is:</p>
            <div class="otp-box">${otp}</div>
            <p style="color:#555;">Enter this OTP to complete your registration.</p>
            <p class="note">⏱ This OTP is valid for <strong>5 minutes</strong> only.<br>Do not share this with anyone.</p>
          </div>
          <div class="footer">
            Bihar Wala Taste — Authentic Bihar Food Delivered Fresh
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send failed:', error.message);
    throw new Error('Failed to send OTP email. Please check your credentials.');
  }
};

module.exports = { sendOtpEmail };

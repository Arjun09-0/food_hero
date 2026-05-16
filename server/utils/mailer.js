const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP email to the user.
 * Falls back to console logging if EMAIL_USER / EMAIL_PASS are not configured.
 */
const sendOtpEmail = async (toEmail, otp) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // ── Console-only fallback (no email config) ──────────────────────────────
  if (!user || !pass || user === 'your-gmail@gmail.com') {
    console.log('\n═══════════════════════════════════════');
    console.log(`  📧  OTP for ${toEmail}  →  [ ${otp} ]`);
    console.log('  (Set EMAIL_USER + EMAIL_PASS in .env to send real emails)');
    console.log('═══════════════════════════════════════\n');
    return;
  }

  // ── Real Gmail SMTP ───────────────────────────────────────────────────────
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"FoodHero 🍱" <${user}>`,
    to: toEmail,
    subject: 'Your FoodHero login code',
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:auto;background:#0a0f0d;color:#f0fdf4;border-radius:16px;padding:32px;">
        <h2 style="color:#16a34a;margin-bottom:8px;">🍱 FoodHero</h2>
        <p style="color:#6b8f74;margin-bottom:24px;">Your one-time login code:</p>
        <div style="letter-spacing:12px;font-size:36px;font-weight:800;color:#f0fdf4;background:#1e3a27;border-radius:12px;padding:20px 24px;text-align:center;">${otp}</div>
        <p style="color:#6b8f74;font-size:13px;margin-top:20px;">This code expires in <strong style="color:#f59e0b;">10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });

  console.log(`✅ OTP email sent to ${toEmail}`);
};

/**
 * Sends volunteer login credentials to the registered email address.
 * Falls back to console logging if EMAIL_USER / EMAIL_PASS are not configured.
 */
const sendVolunteerCredentialsEmail = async (toEmail, password, name) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass || user === 'your-gmail@gmail.com') {
    console.log('\n═══════════════════════════════════════');
    console.log(`  📧  Volunteer credentials for ${toEmail}`);
    console.log(`  Password → [ ${password} ]`);
    console.log('  (Set EMAIL_USER + EMAIL_PASS in .env to send real emails)');
    console.log('═══════════════════════════════════════\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"FoodHero 🍱" <${user}>`,
    to: toEmail,
    subject: 'Your FoodHero volunteer account is ready',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0a0f0d;color:#f0fdf4;border-radius:16px;padding:32px;">
        <h2 style="color:#16a34a;margin-bottom:8px;">🍱 FoodHero</h2>
        <p style="color:#6b8f74;margin-bottom:24px;">Hi ${name || 'Volunteer'}, your volunteer account has been approved.</p>
        <p style="color:#6b8f74;margin-bottom:12px;">Use the credentials below to sign in:</p>
        <div style="background:#1e3a27;border-radius:12px;padding:18px 20px;line-height:1.7;">
          <div><strong style="color:#f0fdf4;">Email:</strong> ${toEmail}</div>
          <div><strong style="color:#f0fdf4;">Password:</strong> ${password}</div>
        </div>
        <p style="color:#6b8f74;font-size:13px;margin-top:20px;">Please sign in and change your password after your first login.</p>
      </div>
    `,
  });

  console.log(`✅ Volunteer credentials email sent to ${toEmail}`);
};

module.exports = { sendOtpEmail, sendVolunteerCredentialsEmail };

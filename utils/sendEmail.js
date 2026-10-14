const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendVerificationEmail(email, otp) {
  return transporter.sendMail({
    from: `"WorkHub" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verify Your WorkHub Email Address",
    text: `Your WorkHub verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <h2 style="color:#7c3aed;">Welcome to WorkHub!</h2>
        <p>Use the verification code below to verify your email address.</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#f3e8ff;color:#6d28d9;border-radius:8px;">
          ${otp}
        </div>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <p>If you did not request this code, you can ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;">
        <p style="font-size:12px;color:#6b7280;">WorkHub Email Verification</p>
      </div>
    `,
  });
}

module.exports = sendVerificationEmail;
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

export async function sendVerificationCode(email, code, prenom) {
  const fromName = process.env.MAIL_FROM_NAME || 'ViteComm';
  const fromAddr = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME;

  await transporter.sendMail({
    from: `"${fromName}" <${fromAddr}>`,
    to: email,
    subject: 'Code de vérification ViteComm',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1D9E75, #0F6E56); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">ViteComm</h1>
        </div>
        <div style="background: #fff; border: 1px solid #E8E6DF; padding: 32px; border-radius: 0 0 16px 16px;">
          <p style="font-size: 16px; color: #2C2C2A;">Bonjour ${prenom},</p>
          <p style="font-size: 14px; color: #5F5E5A;">Voici votre code de vérification pour créer votre compte ViteComm :</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1D9E75; font-family: monospace;">${code}</span>
          </div>
          <p style="font-size: 13px; color: #888780;">Ce code expire dans 10 minutes.</p>
          <p style="font-size: 13px; color: #888780; margin-top: 16px;">Si vous n'avez pas demandé cette inscription, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #E8E6DF; margin: 24px 0;">
          <p style="font-size: 12px; color: #888780; text-align: center;">Équipe ViteComm</p>
        </div>
      </div>
    `,
  });
}

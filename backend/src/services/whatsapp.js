import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendWhatsAppCode(phone, code, prenom) {
  await client.messages.create({
    body: `Bonjour ${prenom} !\n\nVotre code ViteComm : *${code}*\n\nCe code expire dans 10 minutes.\nSi vous n'avez pas demandé ceci, ignorez ce message.`,
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: `whatsapp:${phone}`,
  });
}

export async function sendSMSCode(phone, code, prenom) {
  await client.messages.create({
    body: `Bonjour ${prenom} ! ViteComm: Votre code est ${code}. Expire dans 10 min. Si vous n'avez pas demandé ceci, ignorez ce message.`,
    from: process.env.TWILIO_SMS_NUMBER,
    to: phone,
  });
}

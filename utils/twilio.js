import dotenv from "dotenv";
dotenv.config();
import Twilio from "twilio";

const client = new Twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsAppTemplate(to, message) {
  try {
    const response = await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${to}`,
    });
    return response;
  } catch (err) {
    console.error("Error enviando WhatsApp:", err);
  }
}

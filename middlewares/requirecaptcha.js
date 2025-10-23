import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
export async function verifyCaptcha(req, res, next) {
  const captchaToken = req.body.captcha;

  if (!captchaToken) {
    return res
      .status(400)
      .json({ success: false, message: "Captcha requerido" });
  }

  try {
    const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`
    );

    const data = response.data;
    if (!data.success) {
      return res
        .status(400)
        .json({ success: false, message: "Captcha inválido" });
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error de verificación de captcha" });
  }
}

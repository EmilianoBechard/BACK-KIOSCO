import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

export function authJWT(req, res, next) {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const data = jwt.verify(token, process.env.JWT_KEY_TOKEN);
    req.user = data;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

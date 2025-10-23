import { checkUser } from "../utils/checkUser.js";

export async function requireUser(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });

    const isUser = await checkUser(req.user);
    if (!isUser) return res.status(403).json({ error: "No autorizado" });
    next();
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

import { checkAdminUser } from "../utils/checkAdmin.js";

export async function requireAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });

    const isAdmin = await checkAdminUser(req.user);
    if (!isAdmin) return res.status(403).json({ error: "No autorizado" });

    next();
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

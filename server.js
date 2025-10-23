import express from "express";
import { corsMiddleware } from "./middlewares/cors.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { usersRoutes } from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";

import { pedidosRoutes } from "./routes/pedidosRoutes.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware());

app.use("/admin", adminRoutes);
app.use("/usuario", usersRoutes);
app.use("/pedidos", pedidosRoutes);

app.use((err, req, res, next) => {
  console.error("Error inesperado:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT ?? 8080;

app.listen(PORT, () => {
  console.log(`Server escuchando en http://192.168.100.216:${PORT}`);
});

import { Router } from "express";
import { PedidosController } from "../controllers/pedidosController.js";
import { authJWT } from "../middlewares/verifyjwt.js";
import { requireAdmin } from "../middlewares/requireadmin.js";
import { requireUser } from "../middlewares/requireuser.js";

export const pedidosRoutes = Router();

pedidosRoutes.get(
  "/usuario",
  authJWT,
  requireUser,
  PedidosController.getPedidosUser
);
pedidosRoutes.post(
  "/create/pedido",
  authJWT,
  requireUser,
  PedidosController.createPedidoUser
);
pedidosRoutes.patch(
  "/cancel/pedido/user/:id",
  authJWT,
  requireUser,
  PedidosController.cancelPedidoUser
);
pedidosRoutes.get(
  "/admin/detalles",
  authJWT,
  requireAdmin,
  PedidosController.getDetallesPedidosAdmin
);

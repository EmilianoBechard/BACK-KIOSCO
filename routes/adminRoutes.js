import { Router } from "express";
import { AdminController } from "../controllers/adminController.js";
import { authJWT } from "../middlewares/verifyjwt.js";
import { requireAdmin } from "../middlewares/requireadmin.js";
import { PedidosController } from "../controllers/pedidosController.js";
import { upload } from "../controllers/adminController.js";

export const adminRoutes = Router();

adminRoutes.post("/login", AdminController.loginAdmin);
adminRoutes.post("/logout", authJWT, AdminController.adminLogout);
adminRoutes.get("/auth/check", authJWT, requireAdmin, (req, res) => {
  res.json({
    loggedIn: true,
  });
});
adminRoutes.get(
  "/historial-pedidos",
  authJWT,
  requireAdmin,
  PedidosController.getHistorialPedidosAdmin
);
adminRoutes.get(
  "/productos",
  authJWT,
  requireAdmin,
  AdminController.getProducts
);
adminRoutes.get(
  "/clientes",
  authJWT,
  requireAdmin,
  AdminController.getClientes
);
adminRoutes.get(
  "/categorias",
  authJWT,
  requireAdmin,
  AdminController.getCategorias
);
adminRoutes.post(
  "/categorias",
  authJWT,
  requireAdmin,
  AdminController.createCategoria
);
adminRoutes.post(
  "/producto",
  authJWT,
  requireAdmin,
  upload.single("imagen"),
  AdminController.createProducts
);
adminRoutes.patch(
  "/producto/:id",
  authJWT,
  requireAdmin,
  upload.single("imagen"),
  AdminController.patchProduct
);
adminRoutes.patch(
  "/update/pedido/:id",
  authJWT,
  requireAdmin,
  PedidosController.patchPedidoAdmin
);
adminRoutes.delete(
  "/producto/:id",
  authJWT,
  requireAdmin,
  AdminController.deleteProduct
);
adminRoutes.delete(
  "/categoria/:id",
  authJWT,
  requireAdmin,
  AdminController.deleteCategoria
);

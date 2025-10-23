import { Router } from "express";
import { UserController } from "../controllers/userController.js";
import { authJWT } from "../middlewares/verifyjwt.js";
import { requireUser } from "../middlewares/requireuser.js";
import { verifyCaptcha } from "../middlewares/requirecaptcha.js";

export const usersRoutes = Router();
usersRoutes.get("/productos", UserController.getProducts);
usersRoutes.get("/productos/categorias", UserController.getCategorias);
usersRoutes.get("/sucursales", UserController.getSucursales);

usersRoutes.get("/auth/check", authJWT, requireUser, (req, res) => {
  res.json({
    loggedIn: true,
  });
});
usersRoutes.post("/registrarse", verifyCaptcha, UserController.createUser);
usersRoutes.post("/login", verifyCaptcha, UserController.loginUser);
usersRoutes.post("/logout", authJWT, requireUser, UserController.logoutUser);
usersRoutes.patch("/edit", authJWT, requireUser, UserController.editUser);
/* usersRoutes.delete(
  "/deleteUser",
  authJWT,
  requireUser,
  UserController.deleteUser
);
*/

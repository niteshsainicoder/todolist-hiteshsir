import { Router } from "express";
import {
  registerUser,
  loginuser,
  logoutuser,
  refreshAccessToken
} from "../controllers/user.controllers.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middlware.js";
const userRouter = Router();
const uploads = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "coverImage", maxCount: 1 },
]);

userRouter
  .route("/register")
  .post(uploads, registerUser)
  .get((req, res) => {
    res.send(`working bro`);
  });

userRouter.route("/login").post(loginuser);

userRouter.route("/logout").post(verifyJWT, logoutuser);
userRouter.route(''/refresh-token).post(refreshAccessToken)

export { userRouter };

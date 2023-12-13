import { Router } from "express";
import {
  registerUser,
  loggedinUser,
  logoutuser,
} from "../controllers/user.controllers.js.js";
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

userRouter.route("/login").post(loggedinUser);

userRouter.route("/logout").post(verifyJWT, logoutuser);

export { userRouter };

import { Router } from "express";
import {
  registerUser,
  loginuser,
  logoutuser,
  refreshAccessToken,
  changeCurrentPassword,
  getcurrentUser,
  updateAccountdetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
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
userRouter.route("" / refresh - token).post(refreshAccessToken);

userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);
userRouter.route("/current-user").get(verifyJWT, getcurrentUser);
userRouter.route("/update-account").patch(verifyJWT, updateAccountdetails);
userRouter.route("/avatar").patch(verifyJWT, uploads.single("avatar"), updateAvatar);
userRouter.route("/cover-image").patch(verifyJWT, uploads.single("coverImage"), updateCoverImage);
userRouter.route("/c/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/history").get(verifyJWT, getWatchHistory);

export { userRouter };

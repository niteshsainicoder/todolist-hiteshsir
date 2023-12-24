import { ApiError } from "../utils/apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

const verifyJWT = asynchandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.AccessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    console.log(token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decode = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decode?._id).select(
      "-password -RefreshToken"
    );

    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error, "Invalid Access Token");
    
  }
});

export { verifyJWT };

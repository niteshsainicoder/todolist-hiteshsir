import { ApiError } from "../utils/apierror";
import { asynchandler } from "../utils/asynchandler";
import jwt from "jsonwebtoken";
import {User} from "../models/user.models"

const verifyJWT = asynchandler(async (req, res, next) => {
try {
      const Token =
        req.cookies?.AccesToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    
      if (!Token) {
        throw new ApiError(401, "Anauthorized Request");
      }
    
      const decodedToken = jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET)
    const user = await  User.findById(decodedToken._id).select("-password -refreshToken")
     if (!user) {
    
        throw new ApiError(401,"Invalid Access Token")
     }
    
     req.user=user;
     next();
} catch (error) {
    throw new ApiError(401,"Invalid Access Token")
}

});

export {verifyJWT}

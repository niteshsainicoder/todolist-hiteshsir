import { asynchandler } from "../utils/asynhandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateRefreshToken();
    const RefreshToken = user.generateAccessToken();
    user.RefreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { AccessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Refresh And Access Token"
    );
  }
};

const registerUser = asynchandler(async (req, res) => {
  //get user Detail from frontend,
  //validation-not empty
  //check if user already exists:username se or email se
  //check for images ,chech for avatar
  //upload them to cludinary
  //create user object-  create entry in db
  //remove password and refresh token feild from response
  //check for user creation
  //return response

  const { fullName, email, username, password } = req.body;
  console.log({ fullName, email, username, password });

  // if(fullname == ""){throw new ApiError(400,"fullname is required" )}
  if (
    [fullName, email, username, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  //2 step
  const existeduser = await User.findOne({ $or: [{ username }, { email }] });
  if (existeduser) {
    throw new ApiError(409, "user with email and username exists");
  }

  const avatarlocalpath = req.files?.avatar?.[0]?.path;
  const coverImagelocalpath = req.files?.coverImage?.[0]?.path;

  if (!avatarlocalpath) {
    throw new ApiError(400, "avatar file is required");
  }

  const avatar = await uploadoncloudinary(avatarlocalpath);
  const coverImage = await uploadoncloudinary(coverImagelocalpath);

  if (!avatar) {
    throw new ApiError(400, "avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
    email,
    password,
    userName: username,
  });
  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createduser) {
    throw new ApiError(500, "something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createduser, "User Registered succesfully "));
});

const loginuser = asynchandler(async (req, res) => {
  // req body -> data
  // username or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  const { userName, eMail, password } = req.body;

  if (!userName || !eMail) {
    throw new ApiError(400, "usernam or password is required");
  }

  const user = await User.findOne({ $or: [{ userName }, { eMail }] });
  if (!user) {
    throw new ApiError(404, "User is not find");
  }

  const isPassowrdValid = await user.isPasswordCorrect(password);

  if (!isPassowrdValid) {
    throw new ApiError(401, "Inavalid user credentials");
  }
  const { AccessToken, RefreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("AccesToken", AccessToken, option)
    .cookie("RefreshToken", RefreshToken, option)
    .json(
      new ApiResponse(
        200,
        { user: loggedinUser, AccessToken, RefreshToken },
        "user Logged in succesfully"
      )
    );
});

const logoutuser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { RefreshToken: undefined } },
    { new: true }
  );
  const option = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("AccessToken", option)
    .clearCookie("RefreshToken", option);
});

export { registerUser, logoutuser, loginuser };

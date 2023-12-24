import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { User } from "../models/user.models.js";
import { uploadoncloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiresponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const AccessToken = user.generateAccessToken();
    const RefreshToken = user.generateRefreshToken();
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

  const { fullName, eMail, userName, password } = req.body;
  console.log({ fullName, eMail, userName, password });

  // if(fullname == ""){throw new ApiError(400,"fullname is required" )}
  if (
    [fullName, eMail, userName, password].some((feild) => feild?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  //2 step
  const existeduser = await User.findOne({ $or: [{ userName }, { eMail }] });
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
    eMail,
    password,
    userName,
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

  if (!(userName || eMail)) {
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
    .cookie("AccessToken", AccessToken, option)
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
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asynchandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.RefreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.RefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { AccessToken, RefreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", AccessToken, options)
      .cookie("refreshToken", RefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { AccessToken, RefreshToken: RefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeAccessPassword = asynchandler(async (req, res) => {
  const { oldpassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const ispasswordcorrect = await user.isPasswordCorrect(oldpassword);
  if (!ispasswordcorrect) {
    throw new ApiError(400, "passowrd is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password change successfuly"));
});

const getcurrentUser = asynchandler(async (req, res) => {
  return res.status(200).json(200, req.user, "current user fetchedsuccesfully");
});

const updateAccountdetails = asynchandler(async (req, res) => {
  const { fullName, eMail } = req.body;
  if (!fullName || !eMail) {
    throw new ApiError(400, "all fields are required ");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, eMail } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "sucessfully updated"));
});

const updateAvatar = asynchandler(async (req, res) => {
  const avatrlocalpath = req.file?.path;
  if (!avatrlocalpath) {
    throw new ApiError(400, "please give  avatar image");
  }

  const avatar = await uploadoncloudinary(avatrlocalpath);
  if (!avatar.url) {
    throw new ApiError(400, "error while uploading avatar file ");
  }

  const response = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  return res.status(200).json(response);
});

const updateCoverImage = asynchandler(async (req, res) => {
  const coverlocalpath = req.file?.path;
  if (!avatrlocalpath) {
    throw new ApiError(400, "please give the  cover image");
  }

  const coverImage = await uploadoncloudinary(coverlocalpath);
  if (!coverImage.url) {
    throw new ApiError(400, "error while uploading caver image file ");
  }

  const response = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password");

  return res.status(200).json(response);
});

const getUserChannelProfile = asynchandler(async (req, res) => {
  const { userName } = req.body;
  if (!userName) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscriber",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriberto ",
      },
    },
    {
      $addFields: {
        subscriberscount: {
          $size: "$subscriber",
        },
        channelSubscribertocount: {
          $size: "subscriberto",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscriber.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscriberscount: 1,
        channelSubscribertocount: 1,
        avatar: 1,
        coverImage: 1,
        eMail: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetched succesfully"));
});

export {
  registerUser,
  logoutuser,
  loginuser,
  refreshAccessToken,
  getcurrentUser,
  updateAccountdetails,
  changeAccessPassword,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
};

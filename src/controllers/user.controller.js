import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinay } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import verifyJWT from "../middlewares/auth.middleware.js"

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findOne(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // take all the information
  // then keep the entries in the mongodb
  // avatar and cover image should be handled differently first store locally then upload on cloudinary
  // then generate a refreshToken

  //get user details
  const { fullName, email, username, password } = req.body;
  // console.log("email:",email)

  //validation
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // if(![email].includes("@")){
  //     throw new ApiError(400,"email doesn't contains @ ")
  // }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinay(avatarLocalPath);
  const coverImage = await uploadOnCloudinay(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // take the details
  // then validate if the required fields are not empty
  // then validate the filled details
  // then generate accesstoken store this in the client side || refreshtoken store this the db(only refreshtoken)
  // send cookies

  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const checkPassword = await user.isPasswordCorrect(password);

  if (checkPassword === false) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User loggedIn Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const data = await User.findByIdAndUpdate(
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

  console.log(data);

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodeToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("accessToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler( async(req,res)=>{
  const {oldPassword, newPassword} = req.body

  
  const user = User.findById(req.user?._id)
  
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword)
  
  // if(!(newPassword === confPassword)){
  //   throw new ApiError(401,"New Password and Confirm Password didn't match") // if we want Confirm Password field
  // }

  if(!isPasswordCorrect){
    throw new ApiError(400,"Password Incorrect")
  }
  
  user.password = newPassword
  await user.save({validateBeforeSave:false})
  
  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asyncHandler( async(req,res)=>{
  return res.status(200).json(200,req.user,"Cuurent U ser Fetched Successfully")
})

const updateAccountDetails = asyncHandler( async(req,res)=>{
  const {email,password} = req.body

  if(!email || !password){
    throw new ApiError(400,"All fields are required")
  }

  const user = User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        email,
        password:password
      }
    },
    {
      new:true
    }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200,user,"User Details Updates Successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinay(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(500,"Something went wrong while uploading on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  return res
  .status(200).json(new ApiResponse(200,user,"Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinay(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(500,"Something went wrong while uploading on cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverimage:coverImage.url
      }
    },
    {
      new:true
    }
  ).select("-password")

  return res
  .status(200).json(new ApiResponse(200,user,"Cover Image Updated Successfully"))
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage};

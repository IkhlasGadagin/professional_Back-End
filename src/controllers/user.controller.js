import { ApiError } from "../utils/ApiError.js";
import { asyscHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        // console.log(userId, "userId");
        // console.log(User, "User mongoose");

        const user = await User.findById(userId);
        // console.log(user, "user");


        const generatedaccessToken = user.generateAccessToken();
        const generatedrefreshToken = user.generateRefreshToken();

        //console.log("Type of generateAccessToken:", typeof user.generateAccessToken); double check for undefined
        //      // console.log(generatedrefreshToken, "generatedrefreshToken");

        //here in the user ref refresh token is "" please generated insert to it and save in db without altering Schema*
        user.refreshToken = generatedrefreshToken;

        await user.save({ validateBeforeSave: false });
        return { generatedaccessToken, generatedrefreshToken };
    } catch (error) {
        throw new ApiError(500, error, "Something went wrong while generating access token and refresh token");
    }
}

const registerUser = asyscHandler(async (req, res) => {
    /* 
          1️⃣ Receive the frontend data
          2️⃣ Validate if the required data is present
          3️⃣ Check if the data already exists in the database
          4️⃣ If the data exists, check for image data
          5️⃣ Verify if Multer has received an image
          6️⃣ Upload the image to Cloudinary
          7️⃣ Get the response from Cloudinary
          8️⃣ Create a User object and save the record in the database
          9️⃣ Exclude password and refresh token from the response
          🔟 Send the created user data as a response
    */
    const { fullName, username, email, password } = req.body;
    console.log(fullName);

    if (
        [fullName, username, email, password].some((field) =>
            field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are Required");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or userName already exists");
    }
    console.log(req.files, "response of cloudenery");

    //the image is gone inside the multer take it by files ref path is the original path
    //  of image that went inside the public folder inside temp 
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path;

    }
    // const avatarLocalPath = req?.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;    //this is optional giver undefined if not uploaded

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;

    }
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);   //this gives complete response of cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);   //if image is not there give "" by cloudinary

    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar image to cloudinary");
    }

    const user = await User.create({
        fullName,
        username,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase()
    })
    //confirming weather the user is created or not in db by using _id
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something Went Wrong while creating user");
    }

    return res.status(201).json(
        new ApiResponse(201, "User Created Successfully", createdUser)
    );
})
//LOGIN
const loginUser = asyscHandler(async (req, res) => {
    /* 
    take all the data from frontend
    if data is not there throw error
    check if user is there in db or not IF NOT there throw error
    check if password is correct or not if not throw error
    generate access and refresh Token
    //send cookie with refresh token
    */
    const { username, email, password } = req.body;
    if (!username && !email && !password) {
        throw new ApiError(400, "Username/Email and Password is required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Password is incorrect");

    }
    const { generatedaccessToken, generatedrefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    // calling again because we want refresh token from db which is not present in user object So*
    const loggeduserData = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .cookie("accessToken", generatedaccessToken, options)
        .cookie("refreshToken", generatedrefreshToken, options)
        .json(new ApiResponse(200,
            {
                user: loggeduserData, generatedaccessToken, generatedrefreshToken
            },
            "User Logged in Successfully"))
        ;
    // res.cookie("refreshToken", accessToken.refreshToken, {
    //     httpOnly: true,
    //     sameSite: "none",
    //     secure: true
    // })
    // return res.status(200).json(
    //     new ApiResponse(200, "User Logged in Successfully", userData)
    // )
})

const loggedOut = asyscHandler(async (req, res) => {
    // the user is came from the mideleware verifyJWT via db
    // User.findByIdAndUpdate(req.user._id, { refreshToken: "" });
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1 // this removes the field from document
        }
    },
        {
            new: true
        });

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged out Successfully"));
    // req.user._id
    //clear the cookie and also need to remove the refresh token from db only ny knowing user's id*

})

const refreshAccessToken = asyscHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request token not present");
    }
    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }
        //compare the incoming token with the refresh token in db
        if (user.refreshToken !== incommingRefreshToken) {
            throw new ApiError(401, " Refresh Token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        const { newaccessToken, newrefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", newaccessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(new ApiResponse(200,
                {
                    newaccessToken, newrefreshToken
                },
                "Access Token and Refresh token Refreshed Successfully"))
            ;
    } catch (error) {
        console.log(error, "error in generating new access token and refresh token");
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }

})

const changeCurrentPassword = asyscHandler(async (req, res) => {
    /* 
    take both the password from frontend
    validate
    withthe help of middleware get user's _id get the user by User
    check if current password is correct or not if not throw error
    set the new password to user.password and save it
    send response
    */
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, "Current Password and New Password are required");
    }

    const user = await User.findById(req.user._id);
    const isPasswordRight = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordRight) {
        throw new ApiError(401, "Current Password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully"));
})

const getCurrentUser = asyscHandler(async (req, res) => {
    /* 
    use middleware and send the user thats it
    */
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User Data Fetched Successfully"));
})

const updateUserProfile = asyscHandler(async (req, res) => {
    /* 
    take all the data from frontend
    validate
    get the user by _id
    update the user with the new data
    with _id, $set and  new:true
    */
    const { fullName, email } = req.body;
    if (!fullName || !email) {
        throw new ApiError(400, "Full Name and Email are required");
    }
    //user comes from middleware which holds current user all data from db through decode token  (verifyJWT)
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },

        { new: true }).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Profile with name and email only Updated Successfully"));
})

const updateUserAvatar = asyscHandler(async (req, res) => {
    /* 
    take the avatar from frontend
    validate
    use multer middleware to get the path of the image
    confirm image came or not validate
    if yes upload to cloudinary
    take the url 
    and update the user with the new avatar
    by findByIdAndUpdate($set: {avatar: url})
    */
    const avatarLocalPath = req?.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required to update avatar");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar image to cloudinary");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true })
        .select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "User Avatar Updated Successfully")
    );
})

const updateUserCoverImage = asyscHandler(async (req, res) => {
    /* 
    take the avatar from frontend
    validate
    use multer middleware to get the path of the image
    confirm image came or not validate
    if yes upload to cloudinary
    take the url 
    and update the user with the new avatar
    by findByIdAndUpdate($set: {avatar: url})
    */
    const coverImageLocalPath = req?.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage file is required to update coverImage");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(500, "Failed to upload coverImage image to cloudinary");
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true })
        .select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "User coverImage Updated Successfully")
    );
})

//Aggegration pipeline controller
const getuserChannelProfile = asyscHandler(async (req, res) => {

    //you an take id and search from db and take user name 
    // or you can take user deom the middleware and take username from it

    const username = req.params.username;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "channels"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ]);
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel Profile Fetched Successfully"));
})

const getWatchHistory = asyscHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})

export {
    registerUser, loginUser, loggedOut,
    refreshAccessToken, changeCurrentPassword,
    getCurrentUser, updateUserProfile, updateUserAvatar,
    updateUserCoverImage, getuserChannelProfile,
    getWatchHistory
};
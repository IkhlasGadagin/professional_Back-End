import { ApiError } from "../utils/ApiError.js";
import { asyscHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
    const avatarLocalPath = req.files?.avatar[0].path;
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
export { registerUser };
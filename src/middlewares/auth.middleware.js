import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from "../utils/ApiError.js";
import { asyscHandler } from "../utils/asyncHandler.js";
const verifyJWT = asyscHandler(async (req, _, next) => {
    /* 
    take the token from header or cookie
    verify the token by decode it
    you will get the user id because while creating token we have added user _id in it
    */
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request token not present");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decoded?._id).select("-password");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");

    }
});

export { verifyJWT };
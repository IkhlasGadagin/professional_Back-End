import { Router } from "express";
import { loginUser, registerUser, loggedOut, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

//sub route folled by controller and may followed by middleware
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 3
        }
    ]),
    registerUser
)

router.route("/login").post(
    loginUser
)

router.route("/logout").post(
    verifyJWT,
    loggedOut
)

router.route("/refresh-token").post(
    refreshAccessToken
)
export default router
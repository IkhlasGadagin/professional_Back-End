import { asyscHandler } from "../utils/asyncHandler.js";

const registerUser = asyscHandler(async (req, res) => {
    res.status(200).json({
        message: "User registered successfully"
    });
})

export { registerUser };
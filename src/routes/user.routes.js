import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

//sub route folled by controller and may followed by middleware
router.route("/register").post(registerUser)

export default router
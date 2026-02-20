import { Router } from "express";
import { changeCurrentPassword, creatingFriend, fetchingFriend, loginUser, logoutUser, refreshingAccessToken, registerUser, updateAccountDetails } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshingAccessToken)
router.route("/changepassword").post(verifyJWT,changeCurrentPassword)
router.route("/updateDetails").post(verifyJWT,updateAccountDetails)
router.route("/create-friend").post(verifyJWT,creatingFriend)
router.route("/friend/:friendname").get(verifyJWT,fetchingFriend)


export default router
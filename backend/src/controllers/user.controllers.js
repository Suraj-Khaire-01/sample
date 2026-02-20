import {asyncHandler} from "../utils/AsyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import { Friend } from "../models/friend.model.js"

const generateAccessTokenAndRefreshToken = async(userid) =>{
    try {
        const user = await User.findById(userid);
    
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken;
        user.save({validateBeforeSave:false})
    
        return {refreshToken,accessToken}
    } catch (error) {
        throw new ApiError(504,"Something went wrong while creating refresh tokens or access tokens ")
    }

}

const registerUser = asyncHandler( async (req,res)=>{

    //get data from user
    const {username,email,password,fullname} = req.body

    console.log(username,email,password,fullname);


    //check if the data is empty
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    //check if the email or username exist
    const existingUser = await User.findOne({
        $or:[{email},{username}]
    })

    if (existingUser) {
        throw new ApiError(408,"A user with same username or email exists")
    }

    //make a entry in database

    const user = await User.create({
        username,
        password,
        email,
        fullname
    })

    const createdUser = await User.findById(user._id).select(
        "-password"
    )

    //return the response

    if (!createdUser) {
        throw new ApiError(505,"Server could not create user")
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User created successfully")
    )
})

const loginUser = asyncHandler( async (req,res)=>{
    //get data
    const { email, username, password} = req.body

    //username or email
    if (!(username || email)) {
        throw new ApiError(401,"Username or email is required for login")
    }
    //is entry available
    const user = await User.findOne({
        $or:[{ username },{ email }]
    })

    if (!user) {
        throw new ApiError(403,"User with the username or email is not registered")
    }
    //is pass correct
    const isPassValid = await user.isPasswordCorrect(password);
    if (!isPassValid) {
        throw new ApiError(402,"Incorrect User Credentials")
    }
    //refresh and access token
    
    const {refreshToken, accessToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    //cookies
    const options = {
        httpOnly: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    const me = await User.findOneAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },{
            new:true
        }
    )
    console.log(me);
    const options = {
        httpOnly: true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logout successfully"))
})

const refreshingAccessToken = asyncHandler( async (req,res)=>{

    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized Access")
    }

    try {
        const decodedToken = await jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(402,"Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(403,"Refresh token is expired or used.")
        }
    
        const {refreshToken,accessToken} = generateAccessTokenAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    refreshToken, accessToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(405, error.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler( async (req,res)=>{
    const {oldPassword, newPassword} = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(403,"Both the fields are required.")
    }

    const user = await User.findById(req.user?._id)
    
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(405, "The password is incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(
        new ApiResponse(201,{},"Password changed successfully")
    )
})

const updateAccountDetails = asyncHandler( async ( req, res )=>{
    const {username,email,fullname,wallet,savings} = req.body

    if (!(username || email || fullname || wallet || savings)) {
        throw new ApiError(403, "No information provided for updation")
    }

    const user = await User.findById(req.user?._id)


    if (username?.length) user.username = username;
    if (email?.length) user.email = email;
    if (fullname?.length) user.fullname = fullname;
    if (wallet?.length) user.wallet = wallet;
    if (savings?.length) user.savings = savings;


    // // Save user
    await user.save({validateBeforeSave:false});


    const changedUser = await User.findById(req.user?._id).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(201,changedUser,"User updated successfully")
    )

})

const creatingFriend = asyncHandler( async (req,res)=>{
    const {fullname, contactNo} = req.body

    if (!(fullname || contactNo)) {
        throw new ApiError(407,"All the fields are required")
    }

    const friend = await Friend.create({
        fullname,
        contactNo
    })

    if (!friend) {
        throw new ApiError(503,"Could not create friend")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,{
            $push:{
                friends:friend._id
            }
        },
        {
            new:true
        }
    )
    if (!user) {
        throw new ApiError("Unauthorized request")
    }

    return res
    .status(203)
    .json(
        new ApiResponse(
            200,
            {friend},
            "Friend created successfully"
        )
    )

})

const fetchingFriend = asyncHandler ( async (req,res)=>{
    const {friendname} = req.params

    console.log(friendname);

    if (!friendname.trim()) {
        throw new ApiError(402,"Friend name is missing")
    }

    const user = await User.findById(req.user?._id).select("-password")

    if (!user) {
        throw new ApiError(406,"Unauthorised request")
    }
    console.log(user.friends);

    return res
    .status(203)
    .json(
        new ApiResponse(
            201,
            {user},
            "Friend fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshingAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    fetchingFriend,
    creatingFriend
}
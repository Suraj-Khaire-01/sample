import mongoose from 'mongoose'
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const expenseSchema = new mongoose.Schema({
    name:{
        type:String,
    },
    amount:{
        type:Number
    }
})

const eventSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    expenses:[
        expenseSchema
    ]
})

const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password:{
        type: String,
        required: true
    },
    friends:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Friend'
        }
    ],
    events:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        }
    ],
    email:{
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    fullname:{
        type: String,
        required: true,
        trim: true
    },
    avatar:{
        type:String,
    },
    wallet:{
        type: Number,
    },
    savings:{
        type: Number,
    },
    refreshToken:{
        type:String
    }
},{
    timestamps: true
})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model('User',userSchema)
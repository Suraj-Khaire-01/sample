import mongoose from 'mongoose'

const friendSchema = new mongoose.Schema({
    fullname:{
        type: String,
        required: true
    },
    amount:{
        type: Number,
        default: 0
    },
    contactNo:{
        type: Number,
        required: true,
    },
    transactionhistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Expense"
        }
    ]
},{
    timestamps: true
})

export const Friend = mongoose.model('Friend',friendSchema)
import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema({
    expensename:{
        type: String,
        required: true,
        default: "Miscellanous"
    },
    amount:{
        type:Number,
        required: true
    },
    date:{
        type: Date
    }
},{
    timestamps: true
})

export const Expense = mongoose.model('Expense',expenseSchema)
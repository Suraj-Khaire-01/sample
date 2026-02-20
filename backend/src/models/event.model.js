import mongoose from 'mongoose'

const eventsSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String
    },
    expenses:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expense'
        }
    ],
    eventDate:{
        type: Date,
        required: true,
    }
},{
    timestamps: true
})

export const Event = mongoose.model('Event',eventsSchema)
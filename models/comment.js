const mongoose = require('mongoose')

const commentSchema = mongoose.Schema({
    comment:{
        type: String,
        required: true
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    status: {
        type: Number,
        default: 1
    }
}, { timestamps: true })

module.exports = mongoose.model("comment", commentSchema)
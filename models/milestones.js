const mongoose = require('mongoose')

const milestoneSchema = mongoose.Schema({
    milestoneName:{
        type: String,
        required: true
    },
    owner:{
        type: mongoose.Types.ObjectId,
        required: "user"
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    projectId:{
        type:mongoose.Types.ObjectId,
        ref:"project"
    },
    tags:{
        type: String,
        required: true,
        enum: ["Internal","General"]
    },
    startDate:{
        type: String,
        required: true
    },
    endDate:{
        type: String,
        required: true
    }
},{timestamps:true})

module.exports = mongoose.model("milestone", milestoneSchema)
const mongoose = require('mongoose')

const inviteSchema = mongoose.Schema({
    senderId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    receiverId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    projectId:{
        type:mongoose.Types.ObjectId,
        ref:"project"
    },
    receiverMail:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true
    },
    inviteStatus:{
        type: Number,
        required:true,
        default:0
    },
    status:{
        type: Number,
        default: 1
    }
},{ timestamps: true })

module.exports = mongoose.model("invite", inviteSchema)
const mongoose = require('mongoose')

const notificationSchema = mongoose.Schema({
    senderId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    receiverId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    inviteId:{
        type:mongoose.Types.ObjectId,
        ref:"invite",
        required:false
    },
    message:{
        type: String,
        required: true
    },
    notificationStatus:{
        type:String,
        required: false
    }, 
    status:{
        type: Number,
        default: 1
    }
},{ timestamps: true })

module.exports = mongoose.model("notification", notificationSchema)
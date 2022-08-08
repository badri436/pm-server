const mongoose = require('mongoose')

const issueSchema = mongoose.Schema({
    issue:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: false
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    projectId:{
        type:mongoose.Types.ObjectId,
        ref:"project"
    },
    issueStatus:{
        type: String,
        required: true,
        enum: ["Open", "In Progress", "To be Tested", "Completed"]
    },
    startDate:{
        type: String,
        required: true
    },
    endDate:{
        type: String,
        required: true
    },
    status:{
        type: Number,
        default: 1
    }
},{ timestamps: true })

module.exports = mongoose.model("issue", issueSchema)
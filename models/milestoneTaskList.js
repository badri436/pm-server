const mongoose = require('mongoose')

const milestoneTaskListSchema = mongoose.Schema({
    projectId: {
        type: mongoose.Types.ObjectId,
        ref: "project",
        required: true
    },
    milestoneId: {
        type: mongoose.Types.ObjectId,
        ref: "milestone",
        required: true
    },
    taskId: [{
        type: mongoose.Types.ObjectId,
        ref: "task",
        required: false
    }],
    taskList: {
        type: String,
        required: true
    },
    tags: {
        type: String,
        required: true
    },
    taskListStatus: {
        type: String,
        required: true,
        default: "Open",
        enum: ["Open", "Closed"]
    },
    comments:[{
        type:mongoose.Types.ObjectId,
        ref:"comment"
    }],
    status: {
        type: Number,
        default: 1
    }
}, { timestamps: true })

module.exports = mongoose.model("milestoneTaskList", milestoneTaskListSchema)
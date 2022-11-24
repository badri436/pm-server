const mongoose = require('mongoose')

const taskSchema = mongoose.Schema({
    taskName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    assignTo: {
        type: mongoose.Types.ObjectId,
        ref: "user"
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user"
    },
    projectId: {
        type: mongoose.Types.ObjectId,
        ref: "project"
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ["Low", "Medium", "High"]
    },
    taskStatus: {
        type: String,
        required: true,
        enum: ["Open", "In Progress", "To be Tested", "Closed"]
    },
    taskListId: {
        type: mongoose.Types.ObjectId,
        ref: "milestoneTaskList",
        required: true
    },
    status: {
        type: Number,
        default: 1
    }
}, { timestamps: true })

module.exports = mongoose.model("task", taskSchema)
const mongoose = require('mongoose')

const projectDetailsSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user"
    },
    projectId: {
        type: mongoose.Types.ObjectId,
        ref: "project"
    },
    role: {
        type: String,
        required: true
    },
    recentProjectStatus: {
        type: String,
        required: false
    },
    type: {
        type: String,
        required: true
    },
    collaboratedUsers: [{
        type: mongoose.Types.ObjectId,
        ref: "projectDetails"
    }],
    status: {
        type: Number,
        default: 1
    }
}, { timestamps: true })

module.exports = mongoose.model("projectDetails", projectDetailsSchema)
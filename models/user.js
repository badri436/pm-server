const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    verifyStatus: {
        type: String,
        required: false
    },
    resetToken: {
        type: String,
        required: false
    },
    profileImg: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    designation: {
        type: String,
        required: false
    },
    company: {
        type: String,
        required: false
    },
    status: {
        type: Number,
        default: 1
    }
}, { timestamps: true })

module.exports = mongoose.model("user", userSchema)
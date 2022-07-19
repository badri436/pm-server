const express = require('express')
const authRoute = express.Router()
const authController = require('../controllers/authController')

authRoute.post("/register", authController.register)
authRoute.post("/resendMail", authController.resendMail)
authRoute.post("/accept", authController.activate)
authRoute.post("/forget-password", authController.forgetPassword)
authRoute.post("/resetPassword", authController.resetPassword)
module.exports = authRoute
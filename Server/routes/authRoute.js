const express = require('express')
const authRoute = express.Router()
const authController = require('../controllers/authController')

authRoute.post("/register", authController.register)
authRoute.post("/resendMail", authController.resendMail)
authRoute.post("/accept", authController.activate)

module.exports = authRoute
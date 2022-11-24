const express = require('express')
const notificationRoute = express.Router()
const notificationController = require('../controllers/notificationController')
const middle = require('../middleware/middleware')

notificationRoute.get("/list", middle, notificationController.index)
notificationRoute.post("/decline", middle, notificationController.decline)

notificationRoute.get("/markread", middle, notificationController.markAllRead)

module.exports = notificationRoute
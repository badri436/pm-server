const express = require('express')
const taskRoute = express.Router()
const taskController = require('../controllers/taskController')
const middle = require('../middleware/middleware')

taskRoute.post("/create",middle,taskController.create)
taskRoute.get("/list",middle,taskController.index)

module.exports = taskRoute
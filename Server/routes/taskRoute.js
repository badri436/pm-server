const express = require('express')
const taskRoute = express.Router()
const taskController = require('../controllers/taskController')
const middle = require('../middleware/middleware')


taskRoute.post("/list",middle,taskController.index)
taskRoute.post("/create",middle,taskController.create)

taskRoute.post("/group",middle,taskController.group)


module.exports = taskRoute
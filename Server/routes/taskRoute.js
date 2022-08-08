const express = require('express')
const taskRoute = express.Router()
const taskController = require('../controllers/taskController')
const middle = require('../middleware/middleware')


taskRoute.get("/listbasedonuser",middle,taskController.listBasedOnUser)
taskRoute.get("/listbasedonproject",middle,taskController.listBasedOnProject)
taskRoute.post("/create",middle,taskController.create)

taskRoute.post("/groupbystatus",middle,taskController.groupByStatus)
taskRoute.get("/groupbyproject",middle,taskController.groupByProject)


module.exports = taskRoute
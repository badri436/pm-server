const express = require('express')
const taskRoute = express.Router()
const taskController = require('../controllers/taskController')
const middle = require('../middleware/middleware')

taskRoute.get("/groupbyproject", middle, taskController.groupByProject)
taskRoute.get("/listbasedonuser", middle, taskController.listBasedOnUser)
taskRoute.get("/listbasedonproject", middle, taskController.listBasedOnProject)
taskRoute.post("/create", middle, taskController.create)
taskRoute.post("/individualTask", middle, taskController.individualTaskList)
taskRoute.post("/groupbystatus", middle, taskController.groupByStatus)



module.exports = taskRoute
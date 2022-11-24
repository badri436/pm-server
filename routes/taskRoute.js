const express = require('express')
const taskRoute = express.Router()
const taskController = require('../controllers/taskController')
const middle = require('../middleware/middleware')

taskRoute.get("/listformilestonetasklist", middle, taskController.listForMilestoneTaskList)
taskRoute.get("/groupbystatususer", middle, taskController.groupByStatusUser)
taskRoute.get("/counttask", middle, taskController.countTask)
taskRoute.post("/groupbyproject", middle, taskController.groupByProject)
taskRoute.get("/listbasedonuser", middle, taskController.listBasedOnUser)
taskRoute.post("/listbasedonproject", middle, taskController.listBasedOnProject)
taskRoute.post("/create", middle, taskController.create)
taskRoute.post("/individualTask", middle, taskController.individualTaskList)
taskRoute.post("/update", middle, taskController.updateTask)
taskRoute.post("/groupbystatus", middle, taskController.groupByStatus)

taskRoute.post("/createtaskbasedmilestone", middle, taskController.createTaskBasedOnMilestone)

module.exports = taskRoute
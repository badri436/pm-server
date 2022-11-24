const express = require('express')
const milestoneTaskListRoute = express.Router()
const milestoneTaskListController = require('../controllers/milestoneTaskListController')
const middle = require('../middleware/middleware')

milestoneTaskListRoute.get("/", middle, milestoneTaskListController.index)
milestoneTaskListRoute.post("/create", middle, milestoneTaskListController.create)
milestoneTaskListRoute.post("/list", middle, milestoneTaskListController.milestoneTaskListBasedOnMilestone)
milestoneTaskListRoute.post("/milestoneTasklistProgress", middle, milestoneTaskListController.milestoneTasklistProgress)
milestoneTaskListRoute.post("/comment", middle, milestoneTaskListController.comment)
milestoneTaskListRoute.post("/listComments", middle, milestoneTaskListController.listComments)


module.exports = milestoneTaskListRoute
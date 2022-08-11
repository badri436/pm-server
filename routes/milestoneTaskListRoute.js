const express = require('express')
const milestoneTaskListRoute = express.Router()
const milestoneTaskListController = require('../controllers/milestoneTaskListController')
const middle = require('../middleware/middleware')

milestoneTaskListRoute.post("/create", middle, milestoneTaskListController.create)
milestoneTaskListRoute.post("/list", middle, milestoneTaskListController.milestoneTaskListBasedOnMilestone)

module.exports = milestoneTaskListRoute
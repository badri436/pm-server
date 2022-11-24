const express = require('express')
const issueRoute = express.Router()
const issueController = require('../controllers/issueController')
const middle = require('../middleware/middleware')

issueRoute.post("/create",middle,issueController.create)
issueRoute.get("/listbasedonuser",middle,issueController.issueBasedOnUser)
issueRoute.get("/groupbyproject",middle,issueController.groupByProject)
issueRoute.post("/groupbystatus",middle,issueController.groupByStatus)
issueRoute.get("/groupbystatususer",middle,issueController.groupByStatusUser)
issueRoute.post("/listbasedonproject",middle,issueController.issueBasedOnProject)
issueRoute.post("/update", middle, issueController.updateIssue)
issueRoute.post("/individualIssue", middle, issueController.individualIssueList)
issueRoute.post("/createIssueBasedOnMilestone", middle, issueController.createIssueBasedOnMilestone)
issueRoute.post("/listbasedonmilestone",middle,issueController.issueBasedOnMilestone)

module.exports = issueRoute
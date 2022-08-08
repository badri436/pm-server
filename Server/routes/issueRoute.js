const express = require('express')
const issueRoute = express.Router()
const issueController = require('../controllers/issueController')
const middle = require('../middleware/middleware')

issueRoute.post("/create",middle,issueController.create)
issueRoute.get("/listbasedonuser",middle,issueController.issueBasedOnUser)
issueRoute.get("/groupbyproject",middle,issueController.groupByProject)
issueRoute.get("/groupbystatus",middle,issueController.groupByStatus)
issueRoute.get("/listbasedonproject",middle,issueController.issueBasedOnProject)
module.exports = issueRoute
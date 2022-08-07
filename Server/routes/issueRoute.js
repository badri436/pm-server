const express = require('express')
const issueRoute = express.Router()
const issueController = require('../controllers/issueController')
const middle = require('../middleware/middleware')

issueRoute.post("/create",middle,issueController.create)
issueRoute.get("/listbasedonuser",middle,issueController.issueBasedOnUser)
issueRoute.get("/group",middle,issueController.group)
issueRoute.get("/listbasedonproject",middle,issueController.issueBasedOnProject)
module.exports = issueRoute
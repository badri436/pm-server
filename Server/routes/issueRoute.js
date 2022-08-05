const express = require('express')
const issueRoute = express.Router()
const issueController = require('../controllers/issueController')
const middle = require('../middleware/middleware')

issueRoute.post("/create",middle,issueController.create)
issueRoute.get("/list",middle,issueController.index)


module.exports = issueRoute
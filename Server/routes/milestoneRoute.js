const express = require('express')
const milestoneRoute = express.Router()
const milestoneController = require('../controllers/milestoneController')
const middle = require('../middleware/middleware')

milestoneRoute.post("/create",middle,milestoneController.create)
milestoneRoute.get("/list",middle,milestoneController.index)
milestoneRoute.get("/dropdownlist", middle, milestoneController.list)

milestoneRoute.post("/test",middle,milestoneController.test)

module.exports = milestoneRoute
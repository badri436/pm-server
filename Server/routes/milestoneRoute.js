const express = require('express')
const milestoneRoute = express.Router()
const milestoneController = require('../controllers/milestoneController')
const middle = require('../middleware/middleware')

milestoneRoute.post("/create", middle, milestoneController.create)
milestoneRoute.get("/listbasedonuser", middle, milestoneController.milestoneBasedOnUser)
milestoneRoute.get("/dropdownlist", middle, milestoneController.list)

milestoneRoute.get("/test", middle, milestoneController.test)
milestoneRoute.get("/listbasedonproject", middle, milestoneController.milestoneBasedOnProject)

module.exports = milestoneRoute
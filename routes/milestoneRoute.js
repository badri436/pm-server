const express = require('express')
const milestoneRoute = express.Router()
const milestoneController = require('../controllers/milestoneController')
const middle = require('../middleware/middleware')

milestoneRoute.get("/", middle, milestoneController.index)
milestoneRoute.get("/dropdownmilestonelist", middle, milestoneController.milestoneDropDownlist)
// milestoneRoute.get("/listbasedonuser", middle, milestoneController.milestoneBasedOnUser)
milestoneRoute.get("/dropdownuserlist", middle, milestoneController.listUserBasedOnProject)
milestoneRoute.get("/test", middle, milestoneController.test)
milestoneRoute.get("/listbasedonproject", middle, milestoneController.milestoneBasedOnProject)
milestoneRoute.post("/create", middle, milestoneController.create)
milestoneRoute.post("/listbasedonuser", middle, milestoneController.milestoneBasedOnUser)
milestoneRoute.post("/milestoneProgress", middle, milestoneController.milestoneProgress)
milestoneRoute.post("/comment", middle, milestoneController.comment)
milestoneRoute.post("/update", middle, milestoneController.update)
milestoneRoute.post("/destroy", middle, milestoneController.destroy)
milestoneRoute.post("/listComments", middle, milestoneController.listComments)


module.exports = milestoneRoute
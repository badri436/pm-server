const express = require('express')
const projectRoute = express.Router()
const projectController = require('../controllers/projectController')
const middle = require('../middleware/middleware')

projectRoute.post("/create", middle, projectController.create)
projectRoute.post("/update", middle, projectController.updateProject)
projectRoute.get("/list", middle, projectController.index)
projectRoute.post("/listUser", middle, projectController.listUserBasedOnProject)
projectRoute.get("/dropdownlist", middle, projectController.list)
projectRoute.post("/invite", middle, projectController.inviteUserToProject)
projectRoute.post("/accept", middle, projectController.accept)
projectRoute.post("/recentproject", middle, projectController.recentProject)
projectRoute.post("/removeuser", middle, projectController.removeUser)
projectRoute.post("/destroy", middle, projectController.destroy)
projectRoute.post("/listprojectbyid", middle, projectController.listProjectById)

module.exports = projectRoute
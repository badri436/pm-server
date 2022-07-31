const express = require('express')
const projectRoute = express.Router()
const projectController = require('../controllers/projectController')
const middle = require('../middleware/middleware')

projectRoute.post("/create", middle, projectController.create)
projectRoute.get("/list", middle, projectController.index)


module.exports = projectRoute
const task = require('../models/task')
const project = require('../models/project')
const { default: mongoose } = require('mongoose')
const milestoneTaskList = require('../models/milestoneTaskList')


const create = async (req, res) => {
    try {
        const { taskName, description, assignTo, projectId, startDate, endDate, priority, taskListId } = req.body
        const { userId } = req.user


        const newTask = new task({
            userId,
            taskName,
            description,
            assignTo,
            projectId,
            startDate,
            endDate,
            taskStatus: "Open",
            priority
        })

        await newTask.save();

        await milestoneTaskList.findByIdAndUpdate(taskListId, {
            $push: {
                taskId: newTask._id
            }
        })

        return res.status(200).json({
            "status": true,
            "data": "Task Created Successfully"
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Task Creation Failed!"
        })
    }
}

const listBasedOnUser = async (req, res) => {
    try {
        const { userId } = req.user
        const { count, page } = req.query
        const skip = count * page
        const getTask = await task.find({ status: 1, userId: userId }).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1 } }).populate({ path: "assignTo", model: "user", select: { _id: 1, name: 1 } }).limit(Number(count)).skip(Number(skip))
        const getTaskCount = await task.find({ status: 1, userId: userId }).count()
        return res.status(200).json({
            "status": true,
            "data": getTask,
            "totalCount": getTaskCount
        })
    }
    catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const listBasedOnProject = async (req, res) => {
    try {
        const { projectId } = req.body


        const getTask = await task.find({ status: 1, projectId: projectId })
        return res.status(200).json({
            "status": true,
            "data": getTask
        })
    }
    catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const groupByStatus = async (req, res) => {
    try {
        const { projectId } = req.body
        const filter = await task.aggregate()
            .match({
                projectId: mongoose.Types.ObjectId(projectId)
            })
            .group({
                _id: "$taskStatus",
                taskList: {
                    $push: "$$ROOT"
                }
            })
        console.log(filter)
        return res.status(200).json({
            "status": true,
            "data": filter
        })

    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Task Creation Failed!"
        })
    }
}

const groupByProject = async (req, res) => {
    try {
        const { userId } = req.user
        const { page, count } = req.query
        const skip = page * count

        const { projectId } = req.body
        const filter = await task.aggregate()
            .lookup({
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "projectDetails"
            })
            .lookup({
                from: "users",
                localField: "assignTo",
                foreignField: "_id",
                as: "assignToDetails"
            })
            .unwind({ path: "$projectDetails" })
            .unwind({ path: "$assignToDetails" })
            .project({
                "_id": 1,
                "taskName": 1,
                "description": 1,
                "projectId": 1,
                "taskStatus": 1,
                "assignTo": 1,
                "startDate": 1,
                "endDate": 1,
                "priority": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "projectDetails.projectName": 1,
                "assignToDetails.name": 1
            })
            .group({
                _id: "$projectId",
                taskList: {
                    $push: "$$ROOT"
                }
            })
            .sort({ "createdAt": -1 })
            .facet({
                data: [{ $skip: Number(skip) }, { $limit: Number(count) }]
            })
            .match({
                projectId: mongoose.Types.ObjectId(projectId)
            })
            .group({
                _id: "$taskStatus",
                taskList: {
                    $push: "$$ROOT"
                }
            })

        const taskCount = await task.aggregate().match({
            userId: mongoose.Types.ObjectId(userId)
        }).group({
            _id: "$projectId",
        }).count("totalcount")

        return res.status(200).json({
            "status": true,
            "data": filter[0].data,
            "totalCount": taskCount[0].totalcount
        })

    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

const individualTaskList = async (req, res) => {
    try {
        const { taskId } = req.body
        console.log("hi")
        const getTask = await task.findById(taskId).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1 } }).populate({ path: "assignTo", model: "user", select: { _id: 1, name: 1 } })
        return res.status(200).json({
            "status": true,
            "data": getTask
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

const updateTask = async (req, res) => {
    try {
        const { taskStatus, startDate, endDate, description, taskId, priority } = req.body
        if (taskStatus != "" && taskStatus != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    taskStatus
                }
            })
        }
        if (startDate != "" && startDate != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    startDate
                }
            })
        }
        if (endDate != "" && endDate != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    taskStatus
                }
            })
        }
        if (description != "" && description != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    description
                }
            })
        }
        if (priority != "" && priority != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    priority
                }
            })
        }


        return res.status(200).json({
            "status": true,
            "data": "task updated successfully"
        })

    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

module.exports = { create, listBasedOnUser, listBasedOnProject, groupByStatus, groupByProject, individualTaskList, updateTask }
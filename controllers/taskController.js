const task = require('../models/task')
const issue = require('../models/issues')
const project = require('../models/project')
const projectDetails = require('../models/projectDetails')
const { default: mongoose } = require('mongoose')
const milestoneTaskList = require('../models/milestoneTaskList')
const notification = require('../models/notification')
const user = require('../models/user')

const create = async (req, res) => {
    try {
        const { taskName, description, projectId, startDate, endDate, priority, taskListId, assignTo } = req.body
        const { userId } = req.user
        const getUser = await user.findById(mongoose.Types.ObjectId(userId))
        const getReceiver = await user.findById(mongoose.Types.ObjectId(assignTo))
        const getProject = await project.findById(mongoose.Types.ObjectId(projectId))

        const newTask = new task({
            userId,
            taskName,
            description,
            taskListId: taskListId,
            assignTo: assignTo,
            projectId,
            startDate,
            endDate,
            taskStatus: "Open",
            priority,
        })

        await newTask.save();

        await milestoneTaskList.findByIdAndUpdate(taskListId, {
            $push: {
                taskId: newTask._id
            }
        })

        if (!(mongoose.Types.ObjectId(userId).equals(mongoose.Types.ObjectId(assignTo)))) {
            if (mongoose.Types.ObjectId(getProject.userId).equals(mongoose.Types.ObjectId(userId))) {
                const newNotification = new notification({
                    senderId: userId,
                    receiverId: assignTo,
                    message: `${getUser.name} assigned a task to you`
                })
                await newNotification.save();
            } else {
                const newNotification = new notification({
                    senderId: userId,
                    receiverId: getProject.userId,
                    message: `${getUser.name} assigned a task to ${getReceiver.name}`
                })
                await newNotification.save();

                const newNotification1 = new notification({
                    senderId: userId,
                    receiverId: assignTo,
                    message: `${getUser.name} assigned a task to you`
                })
                await newNotification1.save();
            }
        } else {
            const newNotification = new notification({
                senderId: userId,
                receiverId: getProject.userId,
                message: `${getUser.name} assigned a task to ${getReceiver.name}`
            })
            await newNotification.save();
        }

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

const createTaskBasedOnMilestone = async (req, res) => {
    try {
        const { taskName, description, startDate, endDate, priority, taskListId } = req.body
        const { userId } = req.user

        const getMilestoneTaskList = await milestoneTaskList.findById(taskListId)
        const newTask = new task({
            userId,
            taskName,
            description,
            taskListId: taskListId,
            assignTo: userId,
            projectId: getMilestoneTaskList.projectId,
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

const countTask = async (req, res) => {
    try {
        const { userId } = req.user
        const getAllTask = await task.find({ userId: userId, status: 1 }).populate({ path: "projectId", model: "project", select: { "projectName": 1 } })
        const getOpenTask = await task.find({ userId: userId, status: 1, "taskStatus": "Open" }).populate({ path: "projectId", model: "project", select: { "projectName": 1 } })
        const getAllIssues = await issue.find({ userId: userId, status: 1 }).populate({ path: "projectId", model: "project", select: { "projectName": 1 } })
        const getOpenIssue = await issue.find({ userId: userId, status: 1, "issueStatus": "Open" }).populate({ path: "projectId", model: "project", select: { "projectName": 1 } })
        const getUser = await user.findById(userId)
        return res.status(200).json({
            "status": true,
            "data": {
                "taskCount": getAllTask.length,
                "openTaskCount": getOpenTask.length,
                "issueCount": getAllIssues.length,
                "openIssueCount": getOpenIssue.length,
                "allTask": getAllTask,
                "openTask": getOpenTask,
                "allIssue": getAllIssues,
                "openIssue": getOpenIssue,
                "name": getUser.name,
                "company": getUser.company
            }
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}


const listForMilestoneTaskList = async (req, res) => {
    try {
        const { taskListId, count, page } = req.query
        const skip = count * page;
        const getMilestoneTaskList = await milestoneTaskList.findById(taskListId).populate({ path: "taskId", model: "task", select: { _id: 1, taskName: 1, assignTo: 1, startDate: 1, endDate: 1, priority: 1 }, options: { limit: Number(count), skip: Number(skip) } }).select({ _id: 1 })
        const getMilestoneTaskListCount = await task.find({ taskListId: taskListId }).count()
        return res.status(200).json({
            "status": true,
            "data": getMilestoneTaskList,
            "totalCount": getMilestoneTaskListCount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
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
        const { count, page } = req.query
        const skip = count * page
        const { projectDetailsId } = req.body
        const getProjectDetails = await projectDetails.findById(projectDetailsId)
        const getTask = await task.find({ status: 1, projectId: getProjectDetails.projectId }).populate({ path: "assignTo", model: "user", select: { _id: 1, name: 1 } }).limit(Number(count)).skip(Number(skip))
        const getTaskCount = await task.find({ status: 1, projectId: getProjectDetails.projectId }).count()

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

const groupByStatus = async (req, res) => {
    try {
        const { projectDetailsId } = req.body
        const getProjectDetails = await projectDetails.findById(projectDetailsId)
        const filter = await task.aggregate()
            .match({
                projectId: mongoose.Types.ObjectId(getProjectDetails.projectId),
                status: 1
            })
            .lookup({
                from: "milestonetasklists",
                localField: "taskListId",
                foreignField: "_id",
                as: "taskListDetails"
            })
            .unwind({ path: "$taskListDetails" })
            .group({
                _id: "$taskStatus",
                taskList: {
                    $push: "$$ROOT"
                }
            })


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

        const { projectDetailsId } = req.body
        const getProjectDetails = await projectDetails.findById(projectDetailsId)
        const filter = await task.aggregate()
            .match({
                projectId: mongoose.Types.ObjectId(getProjectDetails.projectId)
            })
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

        const taskCount = await task.aggregate().match({
            projectId: mongoose.Types.ObjectId(getProjectDetails.projectId)
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
        const getTask = await task.findById(taskId).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1 } }).populate({ path: "assignTo", model: "user", select: { _id: 1, name: 1 } }).populate({ path: 'userId', model: "user", select: { _id: 1, profileImg: 1 } })
        const getProjectDetails = await projectDetails.find({ projectId: getTask.projectId })
        return res.status(200).json({
            "status": true,
            "data": getTask,
            "projectDetailsId": getProjectDetails[0]._id
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
            return res.status(200).json({
                "status": true,
                "data": "Task updated successfully"
            })
        }
        if (startDate != "" && startDate != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    startDate
                }
            })
            return res.status(200).json({
                "status": true,
                "data": "startDate updated successfully"
            })
        }
        if (endDate != "" && endDate != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    endDate
                }
            })
            return res.status(200).json({
                "status": true,
                "data": "endDate updated successfully"
            })
        }
        if (description != "" && description != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    description
                }
            })
            return res.status(200).json({
                "status": true,
                "data": "description updated successfully"
            })
        }
        if (priority != "" && priority != null) {
            await task.findByIdAndUpdate(taskId, {
                $set: {
                    priority
                }
            })
            return res.status(200).json({
                "status": true,
                "data": "priority updated successfully"
            })
        }
        else {
            return res.status(200).json({
                "status": false
            })
        }
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

const groupByStatusUser = async (req, res) => {
    try {
        const { userId } = req.user

        const filter = await task.aggregate()
            .match({
                userId: mongoose.Types.ObjectId(userId),
                status: 1
            }).lookup({
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "projectDetails"
            }).unwind({ path: "$projectDetails" })
            .group({
                _id: "$taskStatus",
                taskList: {
                    $push: "$$ROOT"
                }
            })

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

module.exports = { create, countTask, createTaskBasedOnMilestone, listForMilestoneTaskList, listBasedOnUser, listBasedOnProject, groupByStatus, groupByProject, individualTaskList, updateTask, groupByStatusUser }
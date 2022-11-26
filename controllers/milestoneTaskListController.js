const { default: mongoose } = require("mongoose")
const milestone = require("../models/milestones")
const task = require("../models/task")
const milestoneTaskList = require("../models/milestoneTaskList")
const comments = require("../models/comment")
const create = async (req, res) => {
    try {
        const { milestoneId, taskList, tags } = req.body
        const getMilestone = await milestone.find({ status: 1, _id: milestoneId })

        const newMilestoneTaskList = new milestoneTaskList({
            milestoneId,
            projectId: getMilestone[0].projectId,
            taskList,
            taskListStatus: "Open",
            tags
        })
        await newMilestoneTaskList.save();
        return res.status(200).json({
            "status": true,
            "data": "TaskList created Successfully"
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }

}

const milestoneTaskListBasedOnMilestone = async (req, res) => {

    try {
        const { milestoneId } = req.body
        const { count, page } = req.query
        const skip = count * page
        const getMilestoneTaskList = await milestoneTaskList.find({ status: 1, milestoneId: milestoneId }).populate({
            "path": "taskId",
            "model": "task"
        })
        let isTaskStatus = 0;
        const milestonePromise = getMilestoneTaskList.map(async (taskList) => {

            // const tasklistPromise = taskList.taskId.map(async (id) => {
            for (let i = 0; i < taskList.taskId.length; i++) {
                if (taskList.taskId[i].taskStatus == "Open") {
                    isTaskStatus = 0
                    break
                }
                if (taskList.taskId[i].taskStatus == "Closed") {
                    isTaskStatus = 1
                }
            }
            // })
            // await Promise.all(tasklistPromise)


            if (isTaskStatus == 1) {
                await milestoneTaskList.findByIdAndUpdate(taskList._id, {
                    $set: {
                        taskListStatus: "Closed"
                    }
                })
            } else {
                await milestoneTaskList.findByIdAndUpdate(taskList._id, {
                    $set: {
                        taskListStatus: "Open"
                    }
                })
            }

        })
        await Promise.all(milestonePromise)
        const getMilestoneTaskListAfter = await milestoneTaskList.aggregate().match({
            milestoneId: mongoose.Types.ObjectId(milestoneId)
        }).project({
            "_id": 1,
            "taskList": 1,
            "taskListStatus": 1,
            "tags": 1
        }).group({
            "_id": "$taskListStatus",
            "taskList": {
                $push: "$$ROOT"
            }
        }).facet({
            data: [{ $skip: Number(skip) }, { $limit: Number(count) }]
        })
        const getMilestoneTaskListCount = await milestoneTaskList.aggregate().match({
            milestoneId: mongoose.Types.ObjectId(milestoneId)
        }).project({
            "_id": 1,
            "taskList": 1,
            "taskListStatus": 1,
        }).group({
            "_id": "$taskListStatus",
            "taskList": {
                $push: "$$ROOT"
            }
        }).count("totalcount")



        return res.status(200).json({
            "status": true,
            "data": getMilestoneTaskListAfter[0].data,
            "totalCount": getMilestoneTaskListCount.length > 0 && getMilestoneTaskListCount[0].totalcount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed to List"
        })
    }
}

const index = async (req, res) => {
    try {
        const { milestoneTaskListId } = req.query
        const getMilestoneTaskList = await milestoneTaskList.findById(milestoneTaskListId).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1, projectStatus: 1 } }).populate({ path: "milestoneId", model: "milestone", select: { _id: 1 } }).select({ _id: 1, taskList: 1, tags: 1 })
        return res.status(200).json({
            status: true,
            data: getMilestoneTaskList
        })
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: error
        })
    }
}

const milestoneTasklistProgress = async (req, res) => {
    try {


        let closedCount = 0;
        let totalCount = 0;
        const { milestoneTaskListId } = req.body
        const getMilestoneTasklist = await milestoneTaskList.findById(milestoneTaskListId).populate({ path: "taskId", model: "task", select: { _id: 1, taskName: 1, taskStatus: 1 } }).select({ taskId: 1 })

        getMilestoneTasklist.taskId.map((task) => {

            totalCount = totalCount + 1
            if (task.taskStatus === "Closed") {
                closedCount = closedCount + 1
            }
        })

        let closedPercent = (closedCount / totalCount) * 100;
        var truncated = closedPercent - closedPercent % 1;


        return res.status(200).json({
            status: true,
            data: truncated
        })
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: error
        })
    }
}

const comment = async (req, res) => {
    try {
        const { milestoneTaskListId, comment } = req.body
        const { userId } = req.user

        const newComment = new comments({
            comment,
            userId
        })
        await newComment.save()

        await milestoneTaskList.findByIdAndUpdate(milestoneTaskListId, {
            $push: {
                comments: newComment._id
            }
        })
        return res.status(200).json({
            status: true,
            data: "Comment Added!"
        })
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "Failed to Comment"
        })
    }
}

const listComments = async (req, res) => {
    try {
        const { milestoneTaskListId } = req.body
        const { count, page } = req.query
        const skip = count * page
        const getComment = await milestoneTaskList.findById(milestoneTaskListId).select({ comments: 1 }).populate({ path: "comments", model: "comment", select: { comment: 1, userId: 1 }, options: { limit: Number(count), skip: Number(skip) }, populate: { path: "userId", model: "user", select: { name: 1, profileImg: 1 } } })
        const getCommentCount = await milestoneTaskList.findById(milestoneTaskListId)
        return res.status(200).json({
            status: true,
            data: getComment,
            totalCount: getCommentCount.comments.length
        })
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "Failed to List"
        })
    }
}

module.exports = { create, milestoneTaskListBasedOnMilestone, index, milestoneTasklistProgress, comment, listComments }
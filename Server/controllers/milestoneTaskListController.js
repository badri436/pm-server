const { default: mongoose } = require("mongoose")
const milestone = require("../models/milestones")
const task = require("../models/task")
const milestoneTaskList = require("../models/milestoneTaskList")

const create = async (req, res) => {
    try {
        const { milestoneId, taskList, tags } = req.body
        const getMilestone = await milestone.find({ status: 1, _id: milestoneId })
        console.log(getMilestone[0].projectId)
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
                if (taskList.taskId[i].taskStatus == "Completed") {
                    isTaskStatus = 1
                }
            }
            // })
            // await Promise.all(tasklistPromise)

            if (isTaskStatus == 1) {
                await milestoneTaskList.findByIdAndUpdate(taskList._id, {
                    $set: {
                        taskListStatus: "Completed"
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
            "taskListStatus": 1
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
            "taskListStatus": 1
        }).group({
            "_id": "$taskListStatus",
            "taskList": {
                $push: "$$ROOT"
            }
        }).count("totalcount")



        return res.status(200).json({
            "status": true,
            "data": getMilestoneTaskListAfter[0].data,
            "totalCount": getMilestoneTaskListCount[0].totalcount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed to List"
        })
    }
}

module.exports = { create, milestoneTaskListBasedOnMilestone }
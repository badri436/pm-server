const { default: mongoose } = require("mongoose")
const milestone = require("../models/milestones")
const task = require("../models/task")
const milestoneTaskList = require("../models/milestoneTaskList")

const create = async (req, res) => {
    try {
        const { milestoneId, taskList, tags, taskListStatus } = req.body
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

    // try {
    const { milestoneId } = req.body
    let taskCount = 0;
    const { count, page } = req.query
    const skip = count * page
    const getMilestoneTaskList = await milestoneTaskList.find({ status: 1, milestoneId: milestoneId }).populate({
        "path": "taskId",
        "model": "task"
    })

    let completedTaskList = [];
    let openTaskList = [];
    let taskIdArray = ""
    let isTaskStatus = 0;
    const milestonePromise = getMilestoneTaskList.map(async (taskList) => {

        // const tasklistPromise = taskList.taskId.map(async (id) => {
        for (let i = 0; i < taskList.taskId.length; i++) {


            if (taskList.taskId[i].taskStatus == "Open") {
                console.log("hey")
                isTaskStatus = 0
                break
            }
            if (taskList.taskId[i].taskStatus == "Completed") {
                console.log("hey1")
                isTaskStatus = 1
            }
        }
        // })
        // await Promise.all(tasklistPromise)
        console.log("outer", isTaskStatus)

        if (isTaskStatus == 1) {
            await milestoneTaskList.findByIdAndUpdate(taskList._id, {
                $set: {
                    taskListStatus: "Completed"
                }
            })
        } else {
            console.log("false")
            await milestoneTaskList.findByIdAndUpdate(taskList._id, {
                $set: {
                    taskListStatus: "Open"
                }
            })
        }
        console.log(taskList._id)

    })
    await Promise.all(milestonePromise)
    // console.log(openTaskList)
    // console.log(completedTaskList)
    // const promiseComplete = completedTaskList.map(async (id) => {
    //     await milestoneTaskList.findByIdAndUpdate(id, {
    //         $set: {
    //             taskListStatus: "Completed"
    //         }
    //     })
    // })
    // await Promise.all(promiseComplete)

    // const promiseOpen = openTaskList.map(async (id) => {
    //     await milestoneTaskList.findByIdAndUpdate(id, {
    //         $set: {
    //             taskListStatus: "Open"
    //         }
    //     })
    // })
    // await Promise.all(promiseOpen)
    // console.log(openTaskList)
    // console.log(completedTaskList)
    const getMilestoneTaskListAfter = await milestoneTaskList.find({ status: 1, milestoneId: milestoneId })
    const getMilestoneTaskListCount = await milestoneTaskList.find({ status: 1, milestoneId: milestoneId }).count()



    return res.status(200).json({
        "status": true,
        "data": getMilestoneTaskListAfter,
        "totalCount": getMilestoneTaskListCount
    })
    // } catch (error) {
    //     return res.status(400).json({
    //         "status": false,
    //         "message": "Failed to List"
    //     })
    // }
}

module.exports = { create, milestoneTaskListBasedOnMilestone }
const task = require('../models/task')
const project = require('../models/project')
const { default: mongoose } = require('mongoose')

const index = async (req, res) => {
    // try{
    const { projectId } = req.body
    const { userId } = req.user

    const getTask = await task.find({ status: 1, userId: userId, projectId: projectId })
    return res.status(200).json({
        "status": true,
        "data": getTask
    })
}
// catch(error){
//     return res.status(400).json({
//         "status":false,
//         "message":error
//     })
// }
// }

const create = async (req, res) => {
    try {
        const { taskName, description, assignTo, projectId, taskListId, startDate, endDate, priority } = req.body
        const { userId } = req.user

        const newTask = new task({
            userId,
            taskName,
            description,
            assignTo,
            projectId,
            startDate,
            endDate,
            taskStatus: "In Progress",
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

const group = async (req, res) => {
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

        return res.status(200).json({
            "status": true,
            "data": filter
        })

    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

module.exports = { create, index, group }
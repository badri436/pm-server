const task = require('../models/task')
const project = require('../models/project')

const index = async(req,res)=>{
    const {projectId} = req.body
    const { userId } = req.user

    const getTask = await task.find({status:1, userId:userId, projectId:projectId })
    return res.status(200).json({
        "status":true,
        "data":getTask
    })
}

const create = async(req,res)=>{
    // try {
        const {taskName, description, assignTo, projectId, startDate, endDate, priority} = req.body
        const { userId } = req.user
    
        const newTask = new task({
            userId,
            taskName,
            description,
            assignTo,
            projectId,
            startDate,
            endDate,
            priority
        })
    
        await newTask.save();
    
        return res.status(200).json({
            "status":true,
            "data":"Task Created Successfully"
        })
    // } catch (error) {
    //     return res.status(400).json({
    //         "status":false,
    //         "message":"Task Creation Failed!"
    //     })
    // }
}

module.exports = {create, index}
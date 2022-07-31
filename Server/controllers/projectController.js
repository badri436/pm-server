const project = require("../models/project")

const index = async(req,res) => {
    // try {
        const { userId } = req.user
        const getProject = await project.find({status:1, userId:userId})
        return res.status(200).json({
            "status":true,
            "data":getProject
        })
    // } catch (error) {
    //     return res.status(400).json({
    //         "status":false,
    //         "message":"Not Found"
    //     })
    // }
}


const create = async(req,res) => {
    try {
        const { projectName, projectStatus, tags, startDate, endDate} = req.body
        const { userId, name } = req.user
        const newProject = new project({
            projectName,
            owner:name,
            userId:userId,
            projectStatus,
            tags,
            startDate,
            endDate
        })
        await newProject.save();

        return res.status(200).json({
            "status":true,
            "data":"Project Created Successfully!"
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":error
        })
    }
}

module.exports = {create, index}
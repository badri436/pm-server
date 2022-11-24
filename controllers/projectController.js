const { default: mongoose } = require("mongoose")
const invite = require("../models/invite")
const user = require("../models/user")
require("dotenv/config")
const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")
const project = require("../models/project")
const { find } = require("../models/invite")
const projectDetails = require("../models/projectDetails")
const notification = require("../models/notification")
const milestones = require("../models/milestones")
const task = require("../models/task")
const milestoneTaskList = require("../models/milestoneTaskList")

const inviteFile = fs.readFileSync(path.resolve(__dirname, "../views/invite.hbs"), 'utf8')
const inviteTemplate = handlebars.compile(inviteFile)

let transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})


const index = async (req, res) => {
    try {
        const { userId } = req.user
        const { count, page } = req.query
        const skip = count * page
        let percentCalc = 0;
        const getProject = await projectDetails.find({ status: 1, userId: userId }).populate({ path: "projectId", model: "project" }).limit(Number(count)).skip(Number(skip))
        const getProjectCount = await projectDetails.find({ status: 1, userId: userId }).count()
        for (let j = 0; j < getProject.length; j++) {
            if (getProject[j].projectId.milestoneId.length > 0) {

                for (let i = 0; i < getProject[j].projectId.milestoneId.length; i++) {
                    const getMilestone = await milestoneTaskList.find({ milestoneId: getProject[j].projectId.milestoneId[i] })
                    if (getMilestone.length > 0) {


                        let closedCount = 0;
                        let totalCount = 0;
                        let truncated, closedPercent = 0
                        for (let k = 0; k < getMilestone.length; k++) {

                            totalCount = totalCount + 1
                            if (getMilestone[k].taskListStatus === "Closed") {
                                closedCount = closedCount + 1
                            }
                        }
                        closedPercent = (closedCount / totalCount) * 100; //50

                        truncated = (closedPercent - closedPercent % 1); //50
                        percentCalc = (percentCalc + truncated) //100 +50
                    }
                }
                percentCalc = (percentCalc - percentCalc % 1) / getProject[j].projectId.milestoneId.length

                await project.findByIdAndUpdate(getProject[j].projectId._id, {
                    $set: {
                        "percentage": percentCalc
                    }
                })

                percentCalc = 0
            } else {
                await project.findByIdAndUpdate(getProject[j].projectId._id, {
                    $set: {
                        "percentage": 0
                    }
                })

            }
        }




        return res.status(200).json({
            "status": true,
            "data": getProject,
            "totalCount": getProjectCount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Not Found"
        })
    }
}
const listProjectById = async (req, res) => {
    try {
        const { projectId } = req.body
        const getProject = await project.findById(projectId)
        return res.status(200).json({
            "status": true,
            "data": getProject
        })
    } catch (error) {
        return res.status(400).json({
            "status": true,
            "message": error
        })
    }
}
const list = async (req, res) => {
    try {
        const { userId } = req.user
        const getProject = await projectDetails.find({ status: 1, userId: userId }).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1 } }).select({ _id: 1 })

        return res.status(200).json({
            "status": true,
            "data": getProject
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const create = async (req, res) => {
    // try {
    const { projectName, projectStatus, tags, startDate, endDate } = req.body
    const { userId, name } = req.user
    const newProject = new project({
        projectName,
        owner: name,
        userId: userId,
        projectStatus,
        tags,
        startDate,
        endDate
    })
    await newProject.save();

    const newProjectDetail = new projectDetails({
        userId: userId,
        role: "Owner",
        projectId: newProject._id,
        type: "Own",
    })

    await newProjectDetail.save();

    return res.status(200).json({
        "status": true,
        "data": "Project Created Successfully!"
    })
    // } catch (error) {
    //     return res.status(400).json({
    //         "status": false,
    //         "message": error
    //     })
    // }
}

const updateProject = async (req, res) => {
    try {
        const { projectId, projectName, owner, projectStatus, tags, startDate, endDate } = req.body

        if (projectName !== "" && projectName != null) {
            await project.findByIdAndUpdate(projectId, {
                $set: {
                    projectName
                }
            })
        }
        if (owner !== "" && owner != null) {
            await project.findByIdAndUpdate(projectId, {
                $set: {
                    owner
                }
            })

        }
        if (projectStatus !== "" && projectStatus != null) {
            await project.findByIdAndUpdate(projectId, {
                $set: {
                    projectStatus
                }
            })
        }
        if (tags !== "" && tags != null) {
            await project.findByIdAndUpdate(projectId, {
                $set: {
                    tags
                }
            })
        }
        if (startDate !== "" && startDate != null) {
            await project.findByIdAndUpdate(projectId, {
                $set: {
                    startDate
                }
            })
        }
        if (endDate !== "" && endDate != null) {
            await project.findByIdAndUpdate(projectId, {
                $set: {
                    endDate
                }
            })
        }
        return res.status(200).json({
            "status": true,
            "data": "updated Successfully"
        })
    } catch (error) {
        return res.status(400).json({
            "status": true,
            "message": error
        })
    }
}
const inviteUserToProject = async (req, res) => {

    const { userId } = req.user
    const { receiverMail, projectDetailsId, role } = req.body

    const getProjectDetails = await projectDetails.findById(projectDetailsId)
    const getSender = await user.find({ status: 1, _id: userId })
    const getReceiver = await user.find({ status: 1, email: receiverMail })
    const getProject = await project.find({ status: 1, _id: getProjectDetails.projectId })

    const newInvite = new invite({
        senderId: userId,
        projectDetailsId: projectDetailsId,
        projectId: getProjectDetails.projectId,
        receiverMail,
        role
    })

    await newInvite.save();

    if (getReceiver.length > 0) {
        await invite.findByIdAndUpdate(newInvite._id, {
            $set: {
                receiverId: getReceiver[0]._id
            }
        })
    }

    let message = {
        from: getSender.email,
        to: receiverMail,
        subject: "Project Invitation",
        html: inviteTemplate({
            url: process.env.FRONT_END_URL,
            senderName: getSender[0].name,
            projectName: getProject[0].projectName,
            id: newInvite._id
        })
    }


    if (getReceiver.length != 0) {
        const newNotification = new notification({
            senderId: userId,
            receiverId: getReceiver[0]._id,
            inviteId: newInvite._id,
            message: `${getSender[0].name} invited you to a project ${getProject[0].projectName}`
        })
        await newNotification.save();
    }

    transport.sendMail(message, (err) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Invite Sent!")
        }
    })

    return res.status(200).json({
        "status": true,
        "data": "Invite Sent!"
    })
}

const accept = async (req, res) => {
    const { userId } = req.user
    const { inviteId } = req.body
    const currentUser = await user.find({ status: 1, _id: userId })
    const getReceiver = await invite.findById(inviteId)
    if (getReceiver == null) {
        return res.status(400).json({
            "status": false,
            "message": "No Record Found!"
        })
    }
    const getInvite = await invite.findOne({ status: 1, receiverId: userId, projectId: getReceiver.projectId, inviteStatus: 1 })

    if (getReceiver.receiverMail != currentUser[0].email) {
        return res.status(400).json({
            "status": false,
            "message": "Invite Not Allowed"
        })
    }

    if (getReceiver.inviteStatus == 1 || getReceiver.inviteStatus == 2) {
        return res.status(400).json({
            "status": false,
            "message": "Invitation Link Expired"
        })
    }

    if (getInvite) {
        return res.status(400).json({
            "status": false,
            "message": "Already Exists"
        })
    }

    if (!(getReceiver.receiverId)) {
        await invite.findByIdAndUpdate(inviteId, {
            $set: {
                receiverId: userId
            }
        })
    }

    await invite.findByIdAndUpdate(inviteId, {
        $set: {
            inviteStatus: 1
        }
    })

    const newProjectDetail = new projectDetails({
        userId: userId,
        role: getReceiver.role,
        projectId: getReceiver.projectId,
        type: "Collaborate"
    })

    await newProjectDetail.save();

    await projectDetails.findByIdAndUpdate(getReceiver.projectDetailsId, {
        $push: {
            collaboratedUsers: newProjectDetail._id
        }
    })

    return res.status(200).json({
        "status": true,
        "data": "Invite Accepted Successfully!"
    })
}

const listUserBasedOnProject = async (req, res) => {
    try {
        const { projectDetailsId } = req.body
        const { count, page } = req.query
        const skip = count * page
        const getProjectDetails = await projectDetails.findById(projectDetailsId)

        const getUser = await projectDetails.find({ status: 1, projectId: getProjectDetails.projectId }).populate({ path: "userId", model: "user", select: { _id: 1, name: 1, email: 1 } }).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1, userId: 1 } }).select({ userId: 1, projectId: 1, role: 1 }).limit(Number(count)).skip(Number(skip))
        const getUserCount = await projectDetails.find({ status: 1, projectId: getProjectDetails.projectId }).count()


        return res.status(200).json({
            "status": true,
            "data": getUser,
            "totalCount": getUserCount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const recentProject = async (req, res) => {
    const { projectDetailsId } = req.body
    const { userId } = req.user
    if (projectDetailsId != "" && projectDetailsId != null) {


        const getRecentProjectId = await projectDetails.findById(projectDetailsId)

        await projectDetails.findByIdAndUpdate(projectDetailsId, {
            $set: {
                recentProjectStatus: true
            }
        })
    }


    const getRecentProject = await projectDetails.find({ recentProjectStatus: true, userId: userId, status: 1 }).populate({ path: "projectId", model: "project" }).sort({ updatedAt: -1 }).limit(Number(3))
    return res.status(200).json({
        "status": true,
        "data": getRecentProject
    })


}

const removeUser = async (req, res) => {
    const { projectDetailsId } = req.body
    const getProjectDetails = await projectDetails.findById(projectDetailsId)
    await projectDetails.findByIdAndUpdate(projectDetailsId, {
        $set: {
            status: 0
        }
    })
    const getMilestone = await milestones.find({ userId: getProjectDetails.userId, projectId: getProjectDetails.projectId })
    const deleteMilestone = getMilestone.map(async (element) => {
        await milestones.findByIdAndUpdate(element._id, {
            $set: {
                status: 0
            }
        })
    })
    await Promise.all(deleteMilestone)
    const getTask = await task.find({ userId: getProjectDetails.userId, projectId: getProjectDetails.projectId })
    const deleteTask = getTask.map(async (element) => {
        await task.findByIdAndUpdate(element._id, {
            $set: {
                status: 0
            }
        })
    })

    await Promise.all(deleteTask)
    
    const getOwnerProjectDetails = await projectDetails.find({projectId:getProjectDetails.projectId, status:1})
    await projectDetails.findByIdAndUpdate(getOwnerProjectDetails[0]._id, {
        $pull:{
            collaboratedUsers:[getProjectDetails._id]
        }
    })

    return res.status(200).json({
        "status": true,
        "data": "done"
    })
}

const destroy = async (req, res) => {
    try {
        const { projectDetailsId } = req.body
        const getProjectDetails = await projectDetails.findOne({ _id: projectDetailsId })

        const removePromises = getProjectDetails.collaboratedUsers.map(async (element) => {
            await projectDetails.findByIdAndUpdate(element, {
                $set: {
                    status: 0
                }
            })
        })
        await Promise.all(removePromises)
        await projectDetails.findByIdAndUpdate(projectDetailsId, {
            $set: {
                status: 0
            }
        })

        const getTasks = await task.find({ "projectId": getProjectDetails.projectId })

        const taskpromises = getTasks.map(async (ele) => {
            await task.findByIdAndUpdate(ele._id, {
                $set: {
                    "status": 0
                }
            })
        })
        await Promise.all(taskpromises)


        return res.status(200).json({
            "status": true,
            "data": "project deleted successfully"
        })
    } catch (err) {
        return res.status(400).json({
            "status": true,
            "message": err
        })
    }

}

module.exports = { create, updateProject, index, list, inviteUserToProject, accept, listUserBasedOnProject, recentProject, removeUser, destroy, listProjectById }
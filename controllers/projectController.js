const { default: mongoose } = require("mongoose")
const invite= require("../models/invite")
const user = require("../models/user")
require("dotenv/config")
const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")
const project = require("../models/project")
const { find } = require("../models/invite")
const projectDetails = require("../models/projectDetails")


const inviteFile = fs.readFileSync(path.resolve(__dirname, "../views/invite.hbs"), 'utf8')
const inviteTemplate = handlebars.compile(inviteFile)

let transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})


const index = async(req,res) => {
    try {
        const { userId } = req.user
        const {count, page} = req.query
        const skip = count*page
        const getProject = await projectDetails.find({status:1, userId:userId}).populate({path:"projectId", model:"project"}).limit(Number(count)).skip(Number(skip))
        const getProjectCount = await projectDetails.find({status:1, userId:userId}).count()
        return res.status(200).json({
            "status":true,
            "data":getProject,
            "totalCount":getProjectCount
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Not Found"
        })
    }
}

const list = async(req,res) => {
    try {
        const { userId } = req.user
        const getProject = await project.find({status:1, userId:userId}).select({_id:1, projectName:1})
        
        return res.status(200).json({
            "status":true,
            "data":getProject
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Not Found"
        })
    }
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

        const newProjectDetail = new projectDetails({
            userId:userId,
            role:"Owner",
            projectId:newProject._id
        })

        await newProjectDetail.save();

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


const inviteUserToProject = async(req,res) => {

    const { userId } = req.user
    const { receiverMail, projectId, role } = req.body

    const getSender = await user.find({status:1, _id:userId})
    const getReceiver = await user.find({status:1,email:receiverMail})
    const getProject = await project.find({status:1,_id:projectId})
    console.log(getReceiver)


    const newInvite = new invite({
        senderId:userId,
        projectId,
        receiverMail,
        role
    })

    await newInvite.save();

    if(getReceiver.length>0){
        await invite.findByIdAndUpdate(newInvite._id,{
            $set:{
                receiverId:getReceiver[0]._id
            }
        })
    }

    let message = {
        from: getSender.email,
        to: receiverMail,
        subject: "Project Invitation",
        html: inviteTemplate({
            url:process.env.FRONT_END_URL,
            senderName: getSender[0].name,
            projectName: getProject[0].projectName,
            id: newInvite._id
        })
    }

    transport.sendMail(message, (err) => {
        if(err){
            console.log(err)
        }
        else{
            console.log("Invite Sent!")
        }
    })

    return res.status(200).json({
        "status":true,
        "data":"Invite Sent!"
    })
}

const accept = async(req,res) =>{
    const { userId } = req.user
    const {inviteId} = req.body
    const currentUser = await user.find({status:1, _id:userId})
    const getReceiver = await invite.findById(inviteId)
    if(getReceiver == null){
        return res.status(400).json({
            "status":false,
            "message":"No Record Found!"
        })
    }
    const getInvite = await invite.findOne({status:1, receiverId:userId, projectId:getReceiver.projectId, inviteStatus:1})
    console.log(getInvite)
    
    if(getReceiver.receiverMail != currentUser[0].email){
        return res.status(400).json({
            "status":false,
            "message":"Invite Not Allowed"
        })
    }

    if(getReceiver.inviteStatus == 1){
        return res.status(400).json({
            "status":false,
            "message":"Already Accepted"
        })
    }

    if(getInvite){
        return res.status(400).json({
            "status":false,
            "message":"Already Exists"
        })
    }

    if(!(getReceiver.receiverId)){
        await invite.findByIdAndUpdate(inviteId,{
            $set:{
                receiverId:userId
            }
        })
    }

    await invite.findByIdAndUpdate(inviteId,{
        $set:{
            inviteStatus:1
        }
    })
   
    const newProjectDetail = new projectDetails({
        userId:userId,
        role:getReceiver.role,
        projectId:getReceiver.projectId
    })

    await newProjectDetail.save();

    return res.status(200).json({
        "status":true,
        "data": "Invite Accepted Successfully!"
    })
}


module.exports = {create, index, list, inviteUserToProject, accept}
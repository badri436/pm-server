const { default: mongoose } = require("mongoose")
const milestone = require("../models/milestones")
const user = require("../models/user")

const create = async(req,res) => {
    try {
        const {milestoneName, owner, projectId, tags, startDate, endDate} = req.body
        const {userId} = req.user

        const newMilestone = new milestone({
            milestoneName,
            owner,
            projectId,
            userId,
            tags,
            startDate,
            endDate
        })

        await newMilestone.save();

        return res.status(200).json({
            "status":true,
            "data":"Milestone Created Successfully!"
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Milestone Creation Failed"
        })
    }
}

const index = async(req,res)=>{
    const { projectId } = req.body
    const { userId } = req.user
    const {count, page} = req.query
    const skip = count*page
    const getMilestone = await milestone.find({status:1, userId:userId}).populate({path:"owner",model:"user", select:{_id:1, name:1}}).limit(Number(count)).skip(Number(skip))
    const getMilestoneCount = await milestone.find({status:1, userId:userId}).count()
    return res.status(200).json({
        "status":true,
        "data":getMilestone,
        "totalCount":getMilestoneCount
    })
}

const list = async(req,res) => {
    try {
        const getUser = await user.find({status:1}).select({_id:1, name:1})
        
        return res.status(200).json({
            "status":true,
            "data":getUser
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Not Found"
        })
    }
}

const test = async(req,res)=>{
    const { userId } = req.user
    // try{
        const filter = await milestone.aggregate(

        )
        .match({
            userId:mongoose.Types.ObjectId(userId)
        })
        .lookup(
            {
                from: "project",
                localField: "projectId",
                foreignField: "_id",
                as: "projectDetails"
            }
        )
        .group({
            _id:"$projectId",
            milestones:{
                $push:"$$ROOT"
            }
        }).project({
            projectName:{
                _id:"$projectDetails[0]._id"
            }
        })
        
        
        return res.status(200).json({
            "status":true,
            "data": filter
        })
    // }catch(error){
    //     return res.status(200).json({
    //         "status":false,
    //         "message":"Failed"
    //     })
    // }
}

module.exports = {create, index, list, test}
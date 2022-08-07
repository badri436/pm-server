const { default: mongoose } = require("mongoose")
const milestone = require("../models/milestones")
const user = require("../models/user")

const create = async (req, res) => {
    try {
        const { milestoneName, owner, projectId, tags, startDate, endDate } = req.body
        const { userId } = req.user

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
            "status": true,
            "data": "Milestone Created Successfully!"
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Milestone Creation Failed"
        })
    }
}

const milestoneBasedOnUser = async (req, res) => {

    const { userId } = req.user
    const { count, page } = req.query
    const skip = count * page
    const getMilestone = await milestone.find({ status: 1, userId: userId }).populate({ path: "owner", model: "user", select: { _id: 1, name: 1 } }).limit(Number(count)).skip(Number(skip))
    const getMilestoneCount = await milestone.find({ status: 1, userId: userId }).count()
    return res.status(200).json({
        "status": true,
        "data": getMilestone,
        "totalCount": getMilestoneCount
    })
}

const list = async (req, res) => {
    try {
        const getUser = await user.find({ status: 1 }).select({ _id: 1, name: 1 })

        return res.status(200).json({
            "status": true,
            "data": getUser
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Not Found"
        })
    }
}

const test = async(req,res)=>{
    try {
        const { userId } = req.user
        const { page, count } = req.query
        const skip = page * count

        const filter = await milestone.aggregate()
        .match({
            userId:mongoose.Types.ObjectId(userId)
        })
        .lookup(
            {
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "projectDetails"
            }
        ).lookup({
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
        }).unwind({ path: "$projectDetails" }).unwind({ path: "$ownerDetails" }).project({
            "_id": 1,
            "projectId": 1,
            "milestoneName": 1,
            "projectDetails.projectName": 1,
            "tags": 1,
            "startDate": 1,
            "endDate": 1,
            "ownerDetails.name": 1,
            "createdAt": 1,
            "updatedAt": 1
        })
        .group({
            _id:"$projectId",
            milestones:{
                $push:"$$ROOT"
            }
        }).sort({ "createdAt": -1 }).facet({
            data: [{ $skip: Number(skip) }, { $limit: Number(count) }]
        })
        
        const milestoneCount = await milestone.aggregate().match({
            userId: mongoose.Types.ObjectId(userId)
        }).group({
            _id: "$projectId",
        }).count("totalcount")
        console.log(filter[0].data)
        return res.status(200).json({
            "status": true,
            "data": filter[0].data,
            "totalCount": milestoneCount[0].totalcount
        })
        
    }catch(error){
        return res.status(400).json({
            "status":false,
            "message":"Failed"
        })
    }
}

const milestoneBasedOnProject = async(req,res) => {
    const { projectId } = req.body
   
    const { count, page } = req.query
    const skip = count * page
    const getMilestone = await milestone.find({ status: 1, projectId:projectId }).populate({ path: "owner", model: "user", select: { _id: 1, name: 1 } }).limit(Number(count)).skip(Number(skip))
    const getMilestoneCount = await milestone.find({ status: 1, projectId:projectId }).count()
    return res.status(200).json({
        "status": true,
        "data": getMilestone,
        "totalCount": getMilestoneCount
    })
}


module.exports = { create, milestoneBasedOnUser, list, test, milestoneBasedOnProject }
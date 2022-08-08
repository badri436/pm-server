const { default: mongoose } = require("mongoose")
const issues = require("../models/issues")

const create = async(req,res) => {
    
    try{
        const {issue, description, projectId, startDate, endDate} = req.body
        const { userId } = req.user

        const newIssue = new issues({
            issue,
            description,
            userId,
            projectId,
            issueStatus:"Completed",
            startDate,
            endDate,
        })

        await newIssue.save();

        return res.status(200).json({
            "status":true,
            "data":"Issue Created Successfully"
        })
    }catch(error){
        return res.status(400).json({
            "status":false,
            "message":"Issue Creation Failed"
        })
    }
}

const issueBasedOnUser = async(req,res)=>{
   
    try {
        const { userId } = req.user
        const {count, page} = req.query
        const skip = count*page
        const getIssue = await issues.find({status:1, userId:userId}).limit(Number(count)).skip(Number(skip))
        const getIssueCount = await issues.find({status:1, userId:userId}).count()
        return res.status(200).json({
            "status":true,
            "data":getIssue,
            "totalCount":getIssueCount
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Failed"
        })
    }
}

const issueBasedOnProject = async(req,res)=>{
    
    try {
        const { projectId } = req.body
        const {count, page} = req.query
        const skip = count*page
        const getIssue = await issues.find({status:1, projectId:projectId}).limit(Number(count)).skip(Number(skip))
        const getIssueCount = await issues.find({status:1, projectId:projectId}).count()
        return res.status(200).json({
            "status":true,
            "data":getIssue,
            "totalCount":getIssueCount
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Failed"
        })
    }
}

const groupByProject = async(req,res) => {
   
    try {
        const { page, count } = req.query
        const skip = page * count
        const filter = await issues.aggregate()
        .lookup({
            from:"projects",
            localField:"projectId",
            foreignField:"_id",
            as:"projectDetails"
        })
        .unwind({path:"$projectDetails"})
        .project({
            "_id": 1,
            "projectId": 1,
            "userId": 1,
            "issue": 1,
            "description": 1,
            "issueStatus":1,
            "projectDetails.projectName": 1,
            "startDate": 1,
            "endDate": 1,
            "createdAt": 1,
            "updatedAt": 1
        })
        .group({
            _id:"$projectId",
            issues:{
                $push:"$$ROOT"
            }
        })
        .sort({ "createdAt": -1 })
        .facet({
            data: [{ $skip: Number(skip) }, { $limit: Number(count) }]
        })

        const issueCount = await issues.aggregate()
        .group({
            _id: "$projectId",
        }).count("totalcount")

        return res.status(200).json({
            "status":true,
            "data":filter[0].data,
            "totalCount":issueCount[0].totalcount
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Failed"
        })
    }
}


const groupByStatus = async(req,res) => {
    try {
        
        const filter = await issues.aggregate()

        .group({
            _id:"$issueStatus",
            issueList:{
                $push:"$$ROOT"
            }
        })

        return res.status(200).json({
            "status":true,
            "data":filter
        })
    } catch (error) {
        return res.status(400).json({
            "status":false,
            "message":"Failed"
        })
    }
}
module.exports = {create, issueBasedOnUser, issueBasedOnProject, groupByProject, groupByStatus}
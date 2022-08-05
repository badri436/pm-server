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

const index = async(req,res)=>{
    const { projectId } = req.body
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
}
module.exports = {create, index}
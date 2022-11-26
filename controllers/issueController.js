const { default: mongoose } = require("mongoose")
const issues = require("../models/issues")
const projectDetails = require("../models/projectDetails")
const milestoneTaskList = require("../models/milestoneTaskList")

const create = async (req, res) => {

    try {
        const { issue, description, projectId, startDate, endDate } = req.body
        const { userId } = req.user

        const newIssue = new issues({
            issue,
            description,
            userId,
            projectId,
            issueStatus: "Open",
            startDate,
            endDate,
        })

        await newIssue.save();

        return res.status(200).json({
            "status": true,
            "data": "Issue Created Successfully"
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Issue Creation Failed"
        })
    }
}

const issueBasedOnUser = async (req, res) => {

    try {
        const { userId } = req.user
        const { count, page } = req.query
        const skip = count * page
        const getIssue = await issues.find({ status: 1, userId: userId }).populate({ path: "projectId", model: "project", select: { projectName: 1 } }).limit(Number(count)).skip(Number(skip))
        const getIssueCount = await issues.find({ status: 1, userId: userId }).count()
        return res.status(200).json({
            "status": true,
            "data": getIssue,
            "totalCount": getIssueCount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

const issueBasedOnProject = async (req, res) => {

    try {
        const { projectDetailsId } = req.body
        const getProjectDetails = await projectDetails.findById(projectDetailsId)
        const { count, page } = req.query
        const skip = count * page
        const getIssue = await issues.find({ status: 1, projectId: getProjectDetails.projectId }).limit(Number(count)).skip(Number(skip))
        const getIssueCount = await issues.find({ status: 1, projectId: getProjectDetails.projectId }).count()
        return res.status(200).json({
            "status": true,
            "data": getIssue,
            "totalCount": getIssueCount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

const groupByProject = async (req, res) => {

    try {
        const { page, count } = req.query
        const skip = page * count
        const filter = await issues.aggregate()
            .lookup({
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "projectDetails"
            })
            .unwind({ path: "$projectDetails" })
            .project({
                "_id": 1,
                "projectId": 1,
                "userId": 1,
                "issue": 1,
                "description": 1,
                "issueStatus": 1,
                "projectDetails.projectName": 1,
                "startDate": 1,
                "endDate": 1,
                "createdAt": 1,
                "updatedAt": 1
            })
            .group({
                _id: "$projectId",
                issues: {
                    $push: "$$ROOT"
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
            "status": true,
            "data": filter[0].data,
            "totalCount": issueCount[0].totalcount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}


const groupByStatus = async (req, res) => {
    try {

        const { projectDetailsId } = req.body
        const getProjectDetails = await projectDetails.findById(projectDetailsId)
        const filter = await issues.aggregate()
            .match({
                projectId: mongoose.Types.ObjectId(getProjectDetails.projectId)
            })
            .group({
                _id: "$issueStatus",
                issueList: {
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

const groupByStatusUser = async (req, res) => {
    try {
        const { userId } = req.user

        const filter = await issues.aggregate()
            .match({
                userId: mongoose.Types.ObjectId(userId)
            })
            .lookup({
                from: "projects",
                localField: "projectId",
                foreignField: "_id",
                as: "projectDetails"
            }).unwind({ path: "$projectDetails" })
            .group({
                _id: "$issueStatus",
                issueList: {
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
            "message": "Issue Creation Failed!"
        })
    }
}


const updateIssue = async (req, res) => {
    // try {
    const { issueStatus, startDate, endDate, description, issueId } = req.body
    if (issueStatus != "" && issueStatus != null) {
        await issues.findByIdAndUpdate(issueId, {
            $set: {
                issueStatus
            }
        })
        return res.status(200).json({
            "status": true,
            "data": "Issue updated successfully"
        })
    }
    if (startDate != "" && startDate != null) {
        await issues.findByIdAndUpdate(issueId, {
            $set: {
                startDate
            }
        })
        return res.status(200).json({
            "status": true,
            "data": "startDate updated successfully"
        })
    }
    if (endDate != "" && endDate != null) {
        await issues.findByIdAndUpdate(issueId, {
            $set: {
                endDate
            }
        })
        return res.status(200).json({
            "status": true,
            "data": "endDate updated successfully"
        })
    }
    if (description != "" && description != null) {
        await issues.findByIdAndUpdate(issueId, {
            $set: {
                description
            }
        })
        return res.status(200).json({
            "status": true,
            "data": "description updated successfully"
        })
    }

    // } catch (error) {
    //     return res.status(400).json({
    //         "status": false,
    //         "message": "Failed"
    //     })
    // }
}

const individualIssueList = async (req, res) => {
    try {
        const { issueId } = req.body
        const getIssue = await issues.findById(issueId).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1 } }).populate({ path: "userId", model: "user", select: { _id: 1, "name": 1, profileImg: 1 } })
        const getProjectDetails = await projectDetails.find({ projectId: getIssue.projectId })
        return res.status(200).json({
            "status": true,
            "data": getIssue,
            "projectDetailsId": getProjectDetails[0]._id
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

const createIssueBasedOnMilestone = async (req, res) => {

    // try{
    const { issue, description, milestoneTasklistId, startDate, endDate } = req.body
    const { userId } = req.user
    console.log(milestoneTasklistId)
    const getProjectId = await milestoneTaskList.findById(mongoose.Types.ObjectId(milestoneTasklistId))
    console.log(getProjectId)

    const newIssue = new issues({
        issue,
        description,
        userId,
        projectId: getProjectId.projectId,
        milestoneTasklistId,
        issueStatus: "Open",
        startDate,
        endDate,
    })

    await newIssue.save();

    return res.status(200).json({
        "status": true,
        "data": "Issue Created Successfully"
    })
    // }catch(error){
    //     return res.status(400).json({
    //         "status":false,
    //         "message":"Issue Creation Failed"
    //     })
    // }
}

const issueBasedOnMilestone = async (req, res) => {

    try {
        const { milestoneTasklistId } = req.body
        const { count, page } = req.query
        const skip = count * page
        const getIssue = await issues.find({ status: 1, milestoneTasklistId: milestoneTasklistId }).populate({ path: "projectId", model: "project" }).limit(Number(count)).skip(Number(skip))
        const getIssueCount = await issues.find({ status: 1, milestoneTasklistId: milestoneTasklistId }).count()
        return res.status(200).json({
            "status": true,
            "data": getIssue,
            "totalCount": getIssueCount
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

module.exports = { create, issueBasedOnUser, issueBasedOnProject, groupByProject, groupByStatus, groupByStatusUser, updateIssue, individualIssueList, createIssueBasedOnMilestone, issueBasedOnMilestone }
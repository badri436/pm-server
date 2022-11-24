const { default: mongoose } = require("mongoose")
const milestone = require("../models/milestones")
const milestoneTaskList = require("../models/milestoneTaskList")
const project = require("../models/project")
const projectDetails = require("../models/projectDetails")
const comments = require("../models/comment")
const task = require("../models/task")
const index = async (req, res) => {
    try {
        const { milestoneId } = req.query
        const getMilestone = await milestone.findById(milestoneId).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1, projectStatus: 1 } }).select({ _id: 1, milestoneName: 1, tags: 1 })
        return res.status(200).json({
            "status": true,
            "data": getMilestone
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}
const create = async (req, res) => {
    try {
        const { milestoneName, projectId, tags, startDate, endDate } = req.body
        const { userId } = req.user

        const newMilestone = new milestone({
            milestoneName,
            owner: userId,
            projectId,
            userId,
            tags,
            startDate,
            endDate
        })

        await newMilestone.save();

        await project.findByIdAndUpdate(projectId, {
            $push: {
                milestoneId: newMilestone._id
            }
        })

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

const listUserBasedOnProject = async (req, res) => {
    try {
        const { projectId } = req.body
        const getProjectDetails = await projectDetails.find({ projectId: projectId }).populate({ "path": "userId", "model": "user", select: { _id: 1, name: 1 } }).select({ _id: 1 })
        return res.status(200).json({
            "status": false,
            "data": getProjectDetails
        })
    } catch (err) {
        return res.status(400).json({
            "status": false,
            "message": err
        })
    }
}

const update = async (req, res) => {
    try {
        const { milestoneName, tags, startDate, endDate, milestoneId } = req.body

        if (milestoneName !== "" && milestoneName != null) {
            await milestone.findByIdAndUpdate(milestoneId, {
                $set: {
                    "milestoneName": milestoneName
                }
            })
        }

        if (tags !== "" && tags != null) {
            await milestone.findByIdAndUpdate(milestoneId, {
                $set: {
                    "tags": tags
                }
            })
        }

        if (startDate !== "" && startDate != null) {
            await milestone.findByIdAndUpdate(milestoneId, {
                $set: {
                    "startDate": startDate
                }
            })
        }

        if (endDate !== "" && endDate != null) {
            await milestone.findByIdAndUpdate(milestoneId, {
                $set: {
                    "endDate": endDate
                }
            })
        }

        return res.status(200).json({
            "status": true,
            "data": "updated successfully"
        })
    } catch (error) {

        return res.status(400).json({
            "status": true,
            "message": error
        })
    }
}

const destroy = async (req, res) => {
    try {
        const { milestoneId } = req.body
        const getMilestoneTaskList = await milestoneTaskList.find({ "milestoneId": milestoneId })

        const milestonepromises = getMilestoneTaskList.map(async (element) => {
            await milestoneTaskList.findByIdAndUpdate(element._id, {
                $set: {
                    "status": 0
                }
            })

            element.taskId.map(async (taskid) => {
                await task.findByIdAndUpdate(taskid, {
                    $set: {
                        "status": 0
                    }
                })
            })
        })
        await Promise.all(milestonepromises)

        await milestone.findByIdAndUpdate(milestoneId, {
            $set: {
                "status": 0
            }
        })
        return res.status(200).json({
            "status": true,
            "data": "deleted successfully"
        })
    } catch (error) {
        return res.status(400).json({
            "status": true,
            "message": error
        })
    }
}
// const milestoneBasedOnUser = async (req, res) => {

//     const { userId } = req.user
//     const { count, page } = req.query
//     const skip = count * page
//     const getMilestone = await milestone.find({ status: 1, userId: userId }).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1 } }).populate({ path: "owner", model: "user", select: { _id: 1, name: 1 } }).limit(Number(count)).skip(Number(skip))
//     const getMilestoneCount = await milestone.find({ status: 1, userId: userId }).count()
//     return res.status(200).json({
//         "status": true,
//         "data": getMilestone,
//         "totalCount": getMilestoneCount
//     })
// }


const test = async (req, res) => {
    try {
        const { userId } = req.user
        const { page, count } = req.query
        const skip = page * count
        const filter = await projectDetails.aggregate()
            .match({
                userId: mongoose.Types.ObjectId(userId),
                status: 1
            })
            .lookup(
                {
                    from: "projects",
                    localField: "projectId",
                    foreignField: "_id",
                    as: "projectDetails"
                }

            ).unwind({ path: "$projectDetails" }).lookup({
                from: "milestones",
                localField: "projectDetails.milestoneId",
                foreignField: "_id",
                as: "milestoneDetails"
            }).lookup({
                from: "users",
                localField: "milestoneDetails.userId",
                foreignField: "_id",
                as: "ownerDetails"
            }).unwind({ path: "$ownerDetails" }).project({
                "_id": 1,
                "projectId": 1,
                "projectDetails._id": 1,
                "projectDetails.projectName": 1,
                "projectDetails.milestoneId": 1,
                "ownerDetails.name": 1,
                "ownerDetails._id": 1,
                "milestoneDetails._id": 1,
                "milestoneDetails.milestoneName": 1,
                "milestoneDetails.userId": 1,
                "milestoneDetails.tags": 1,
                "milestoneDetails.startDate": 1,
                "milestoneDetails.endDate": 1,
                "milestoneDetails.createdAt": 1,
                "milestoneDetails.updatedAt": 1,
                "milestoneDetails.status": 1,
            }).addFields({
                milestoneDetails: {
                    $filter: {
                        input: '$milestoneDetails',
                        as: 'milestoneDetails',
                        cond: {
                            $eq: ['$$milestoneDetails.status', 1],
                        },
                    },
                },
            })
            .group({
                _id: "$projectId",
                milestones: {
                    $push: "$$ROOT"
                }
            }).sort({ "createdAt": -1 }).facet({
                data: [{ $skip: Number(skip) }, { $limit: Number(count) }]
            })

        const milestoneCount = await milestone.aggregate().match({
            userId: mongoose.Types.ObjectId(userId)
        }).group({
            _id: "$projectId",
        }).count("totalcount")
        console.log(filter[0].data.length)
        return res.status(200).json({
            "status": true,
            "data": filter[0].data,
            "totalCount": filter[0].data.length > 0 && filter[0].data.length
        })

    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": "Failed"
        })
    }
}

const milestoneBasedOnProject = async (req, res) => {
    const { projectId } = req.body
    const { count, page } = req.query
    const skip = count * page
    const getMilestone = await milestone.find({ status: 1, projectId: projectId }).populate({ path: "owner", model: "user", select: { _id: 1, name: 1 } }).limit(Number(count)).skip(Number(skip))
    const getMilestoneCount = await milestone.find({ status: 1, projectId: projectId }).count()
    return res.status(200).json({
        "status": true,
        "data": getMilestone,
        "totalCount": getMilestoneCount
    })
}

const milestoneBasedOnUser = async (req, res) => {
    const { userId } = req.user
    const getMilestone = await projectDetails.find({ userId: userId }).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1, milestoneId: 1 }, populate: { path: "milestoneId", model: "milestone" } })
    console.log(getMilestone)
    return res.status(200).json({
        "status": true,
        "data": getMilestone
    })
}

const milestoneDropDownlist = async (req, res) => {
    try {
        const { projectId } = req.query
        const getMilestone = await milestoneTaskList.find({ projectId: projectId, status: 1 }).populate({ path: "milestoneId", model: "milestone", select: { _id: 1, milestoneName: 1 } }).select({ _id: 1, taskList: 1 })
        return res.status(200).json({
            "status": true,
            "data": getMilestone
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const milestoneProgress = async (req, res) => {
    let closedCount = 0;
    let totalCount = 0;
    const { milestoneId } = req.body
    const getMilestone = await milestoneTaskList.find({ milestoneId: milestoneId })
    console.log(getMilestone)

    getMilestone.map((taskList) => {
        totalCount = totalCount + 1
        if (taskList.taskListStatus === "Closed") {
            closedCount = closedCount + 1
        }
        console.log(taskList.taskListStatus)
    })

    let closedPercent = (closedCount / totalCount) * 100;
    var truncated = closedPercent - closedPercent % 1;
    console.log(truncated);


    return res.status(200).json({
        "status": true,
        "data": truncated
    })


}

const comment = async (req, res) => {
    try {
        const { milestoneId, comment } = req.body
        const { userId } = req.user

        const newComment = new comments({
            comment,
            userId
        })
        await newComment.save()

        await milestone.findByIdAndUpdate(milestoneId, {
            $push: {
                comments: newComment._id
            }
        })
        return res.status(200).json({
            status: true,
            data: "Comment Added!"
        })
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "Failed to Comment"
        })
    }
}

const listComments = async (req, res) => {
    try {
        const { milestoneId } = req.body
        const { count, page } = req.query
        const skip = count * page
        const getComment = await milestone.findById(milestoneId).select({ comments: 1 }).populate({ path: "comments", model: "comment", select: { comment: 1, userId: 1 }, options: { limit: Number(count), skip: Number(skip) }, populate: { path: "userId", model: "user", select: { name: 1, profileImg: 1 } } })
        const getCommentCount = await milestone.findById(milestoneId).select({ comments: 1 })

        return res.status(200).json({
            status: true,
            data: getComment,
            totalCount: getCommentCount.comments.length
        })
    } catch (error) {
        return res.status(400).json({
            status: false,
            message: "Failed to List"
        })
    }
}

module.exports = { create, update, destroy, index, milestoneBasedOnUser, test, milestoneBasedOnProject, listUserBasedOnProject, milestoneDropDownlist, milestoneProgress, comment, listComments }
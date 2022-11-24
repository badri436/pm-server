const { default: mongoose } = require("mongoose")
const invite = require("../models/invite")
const notification = require("../models/notification")

const index = async (req, res) => {
    const { userId } = req.user
    const getNotification = await notification.find({ receiverId: userId }).populate({ path: "senderId", model: "user", select: { _id: 1, name: 1, profileImg: 1 } }).select({ senderId: 1, message: 1, createdAt: 1 })
    const getNotificationCount = await notification.find({ receiverId: userId }).count()

    return res.status(200).json({
        "status": true,
        "data": getNotification,
        "totalCount": getNotificationCount
    })
}

const decline = async (req, res) => {
    try {
        const { inviteId } = req.body
        const { userId, name } = req.user

        const getReceiver = await invite.findById(inviteId).populate({ path: "projectId", model: "project", select: { _id: 1, projectName: 1 } })

        await invite.findById(inviteId, {
            $set: {
                inviteStatus: 2
            }
        })

        const newNotification = new notification({
            senderId: userId,
            receiverId: getReceiver.senderId,
            message: `${name} declined your invitation for ${getReceiver.projectId.projectName}`
        })
        await newNotification.save();

        return res.status(200).json({
            "status": true,
            "data": "Request Declined"
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const markAllRead = async (req, res) => {
    const { userId } = req.user
    const getNotification = await notification.find({ receiverId: userId, notificationStatus: true })
    if (getNotification > 0) {
        const notifyPromise = getNotification.map(async (element) => {
            await notification.findByIdAndUpdate(element._id, {
                $set: {
                    notificationStatus: false
                }
            })
        })
        await Promise.all(notifyPromise)
    }

    return res.status(200).json({
        "status": true,
        "data": "done"
    })
}

module.exports = { index, decline, markAllRead }
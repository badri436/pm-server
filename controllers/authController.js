const user = require("../models/user")
const projectDetails = require("../models/projectDetails")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require("dotenv/config")
const { OAuth2Client } = require('google-auth-library')
const client = new OAuth2Client(process.env.CLIENT_ID)
const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")

const config = require("../config")
const { populate } = require("../models/user")
const indexFile = fs.readFileSync(path.resolve(__dirname, "../views/index.hbs"), 'utf8')
const resetFile = fs.readFileSync(path.resolve(__dirname, "../views/Verify.hbs"), 'utf8')
const verifyTemplate = handlebars.compile(indexFile)
const resetTemplate = handlebars.compile(resetFile)
let transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})
const googleSigin = async (req, res) => {
    try {
        const { token } = req.body
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID
        });
        const getUserData = ticket.getPayload()

        const getUser = await user.findOne({ email: getUserData.email })
        if (getUser == null) {
            let defaultPassword = await bcrypt.hash(`${Date.now()}`, 10);

            const newUser = new user({
                name: getUserData.name,
                email: getUserData.email,
                password: defaultPassword,
                verifyStatus: "success"
            })
            await newUser.save()

            const token = jwt.sign({ userId: newUser._id, email: newUser.email, name: newUser.name }, process.env.TOKENID, { expiresIn: "1d" })
            return res.status(200).json({
                "status": true,
                "data": token,
                "user": {
                    "userId": getUser._id
                }
            })
        } else {

            if (getUser.verifyStatus == "pending") {
                await user.findByIdAndUpdate(getUser._id, {
                    $set: {
                        verifyStatus: "success"
                    }
                })
                const token = jwt.sign({ userId: getUser._id, email: getUser.email, name: getUser.name }, process.env.TOKENID, { expiresIn: "1d" })
                return res.status(200).json({
                    "status": true,
                    "data": token,
                    "user": {
                        "userId": getUser._id
                    }
                })
            }
            const token = jwt.sign({ userId: getUser._id, email: getUser.email, name: getUser.name }, process.env.TOKENID, { expiresIn: "1d" })
            return res.status(200).json({
                "status": true,
                "data": token,
                "user": {
                    "userId": getUser._id,
                    "image": getUser.profileImg
                }
            })

        }
    } catch (error) {
        res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const updateProfile = async (req, res) => {
    try {
        const { address, profileImg, role, company } = req.body
        console.log(profileImg)
        const { userId } = req.user
        if (address !== "" && address !== null) {
            await user.findByIdAndUpdate(userId, {
                $set: {
                    "address": address
                }
            })
        }
        if (profileImg !== "" && profileImg !== null) {
            await user.findByIdAndUpdate(userId, {
                $set: {
                    "profileImg": profileImg
                }
            })
        }
        if (role !== "" && role !== null) {
            await user.findByIdAndUpdate(userId, {
                $set: {
                    "designation": role
                }
            })
        }
        if (company !== "" && company !== null) {
            await user.findByIdAndUpdate(userId, {
                $set: {
                    "company": company
                }
            })
        }

        return res.status(200).json({
            "status": true,
            "data": "updated successfully"
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const register = async (req, res) => {
    const { name, email, password } = req.body
    const getUser = await user.findOne({ email: email })

    if (getUser) {
        return res.status(400).json({
            "status": false,
            "message": config.user_already_exists
        })
    }

    const encryptPassword = await bcrypt.hash(password, 10)

    const newUser = new user({
        name,
        email,
        password: encryptPassword.toString(),
        verifyStatus: "pending"
    })
    await newUser.save()

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, process.env.TOKENID, { expiresIn: "5m" })

    let message = {
        from: process.env.FROM,
        to: newUser.email,
        subject: "User Account Email Confirmation",
        html: verifyTemplate({
            url: process.env.FRONT_END_URL,
            token: token
        })
    }
    transport.sendMail(message, (err) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Mail Sent!")
        }
    })

    res.status(200).json({
        "status": true,
        "data": config.signup_success
    })
}

const resendMail = async (req, res) => {
    const { email } = req.body
    const getUser = await user.findOne({ email })
    if (getUser) {
        const token = jwt.sign({ id: getUser._id, email: getUser.email }, process.env.TOKENID, { expiresIn: "10m" })

        let message = {
            from: process.env.FROM,
            to: getUser.email,
            subject: "User Account Email Confirmation",
            html: verifyTemplate({
                url: process.env.FRONT_END_URL,
                token: token
            })
        }
        transport.sendMail(message, (err) => {
            if (err)
                console.log(err)
            else
                console.log("Mail Sent!")
        })

        // await user.findByIdAndUpdate(getUser.id, {
        //     $set: {
        //         verifyStatus: "Success"
        //     }
        // })
    }
    else {
        return res.status(400).json({
            "status": false,
            "message": config.user_not_exist
        })
    }

    res.status(200).json({
        "status": true,
        "data": config.mail_sent
    })
}

const activate = async (req, res) => {
    try {
        const { token } = req.body
        if (token) {
            const getToken = await getDecoded(token)
            if ((getToken) == "error") {
                return res.status(400).json({
                    "status": false,
                    "message": config.token_expired
                })
            }
            const { id } = getToken
            const getUser = await user.findById(id)
            if (getUser) {
                if (getUser.verifyStatus == "success") {
                    return res.status(400).json({
                        "status": false,
                        "message": config.user_already_verified
                    })
                }
                await user.findByIdAndUpdate(id, {
                    $set: {
                        "verifyStatus": "success"
                    }
                })
            } else {
                return res.status(400).json({
                    "status": false,
                    "message": config.user_not_exist
                })
            }
        }
        return res.status(200).json({
            "status": true,
            "data": config.user_verified
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}


const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const getUser = await user.findOne({ email })
        if (getUser) {
            if (getUser.verifyStatus === "success") {
                const passwordCheck = await bcrypt.compare(password, getUser.password)

                if (passwordCheck) {
                    const token = jwt.sign({ userId: getUser._id, email: getUser.email, name: getUser.name }, process.env.TOKENID, { expiresIn: "1d" })
                    res.status(200).json({
                        "status": true,
                        "data": token,
                        "user": {
                            "userId": getUser._id,
                            "image": getUser.profileImg
                        }
                    })
                }
                else {
                    res.status(400).json({
                        "status": false,
                        "message": config.password_incorrect
                    })
                }
            }
            else {
                res.status(400).json({
                    "status": false,
                    "message": config.account_verification_pending
                })
            }
        }
        else {
            return res.status(400).json({
                "status": false,
                "message": config.user_not_exist
            })
        }
    } catch (error) {
        res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body
        const getUser = await user.findOne({ "email": email })
        if (getUser != null || getUser != undefined) {
            const token = jwt.sign({ id: getUser._id, email: getUser.email }, process.env.RESET_TOKENID, { expiresIn: "20m" })
            var message = {
                from: process.env.FROM,
                to: getUser.email,
                subject: "Reset Password",
                html: resetTemplate({
                    url: process.env.FRONT_END_URL,
                    token: token
                })
            }
            transport.sendMail(message, (err) => {
                if (err) {
                    console.log(err)
                }
                else {
                    return res.status(200).json({
                        "status": true,
                        "data": config.mail_sent
                    })
                }
            })
        } else {
            console.log("hi")
            return res.status(400).json({
                "status": false,
                "message": config.invalid_mail
            })
        }
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "data": error
        })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body
        if (token) {
            const decodedToken = await getDecodedPassword(token)
            const decodedPassword = await bcrypt.hash(password, 10)
            if (decodedToken != "error") {
                const { id } = decodedToken
                await user.findByIdAndUpdate(id, {
                    $set: {
                        "password": decodedPassword.toString()
                    }
                })
                return res.status(200).json({
                    "status": true,
                    "data": config.password_reset_success
                })
            } else {
                return res.status(400).json({
                    "status": false,
                    "message": config.token_expired
                })
            }
        } else {
            return res.status(400).json({
                "status": false,
                "message": config.token_invalid
            })
        }

    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body
        const { userId } = req.user
        const getUser = await user.findById(userId)
        const passwordCheck = await bcrypt.compare(oldPassword, getUser.password)
        if (passwordCheck) {
            await user.findByIdAndUpdate(userId, {
                $set: {
                    "password": newPassword
                }
            })

            return res.status(200).json({
                "status": true,
                "data": "password changed successfully"
            })
        } else {
            return res.status(400).json({
                "status": false,
                "message": "old password mismatched"
            })
        }
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}
const listUser = async (req, res) => {
    try {
        const { userId } = req.user

        const getUser = await user.findById(userId)
        return res.status(200).json({
            "status": true,
            "data": getUser
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

const getDecoded = (token) => {
    return new Promise((resolve) => {
        jwt.verify(token, process.env.TOKENID, async (err, decoded) => {
            if (!err) {
                resolve(decoded)
            } else {
                resolve("error")
            }
        })
    })
}
const getDecodedPassword = (token) => {
    return new Promise((resolve) => {
        jwt.verify(token, process.env.RESET_TOKENID, async (err, decoded) => {
            if (!err) {
                resolve(decoded)
            } else {
                resolve("error")
            }
        })
    })
}

const listAllUser = async (req, res) => {
    try {
        const { projectDetailsId } = req.body
        let getUsers = []
        const getProjectDetails = await projectDetails.findById(projectDetailsId).select({ userId: 1, collaboratedUsers: 1 }).populate({ path: "collaboratedUsers", model: "projectDetails", select: { _id: 1, userId: 1 }, populate: { path: "userId", model: "user", select: { _id: 1, name: 1 } } }).populate({ path: "userId", model: "user", select: { _id: 1, name: 1 } })
        if (getProjectDetails.collaboratedUsers.length > 0) {
            getProjectDetails.collaboratedUsers.map((user) => {
                getUsers.push(user.userId)
            })
            getUsers.push(getProjectDetails.userId)
        }



        return res.status(200).json({
            "status": true,
            "data": getUsers
        })
    } catch (error) {
        return res.status(400).json({
            "status": false,
            "message": error
        })
    }
}

module.exports = { register, changePassword, listUser, listAllUser, updateProfile, resendMail, googleSigin, activate, forgetPassword, resetPassword, login }
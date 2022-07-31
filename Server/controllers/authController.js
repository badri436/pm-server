const user = require("../models/user")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require("dotenv/config")

const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")

const config = require("../config")
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

const register = async (req, res) => {
    const { name, email, password } = req.body
    const getUser = await user.findOne({ email })

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


const login = async(req,res) => {
    try{
        const { email, password } = req.body
        const getUser = await user.findOne({email})
        if(getUser){
            if(getUser.verifyStatus === "success"){
                const passwordCheck = await bcrypt.compare(password,getUser.password)
    
                if(passwordCheck){
                    const token = jwt.sign({userId:getUser._id, email:getUser.email, name:getUser.name},process.env.TOKENID,{expiresIn:"1d"})
                    res.status(200).json({
                        "status":true,
                        "data": token
                    })
                }        
                else{
                    res.status(400).json({
                        "status":false,
                        "message":config.password_incorrect
                    })
                }
            }        
            else{
                res.status(400).json({
                    "status":false,
                    "message":config.account_verification_pending
                })
            }
        }
        else{
            return res.status(400).json({
                "status":false,
                "message":config.user_not_exist
            })
        }
    }catch(error){
        res.status(400).json({
            "status":false,
            "message":error
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

module.exports = { register, resendMail, activate, forgetPassword, resetPassword, login }
const user = require("../models/user")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
require("dotenv/config")

const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")


const indexFile = fs.readFileSync(path.resolve(__dirname, "../views/index.hbs"), 'utf8')

const verifyTemplate = handlebars.compile(indexFile)
let transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "rithisathaiyan@gmail.com",
        pass: "wtvpgrjbubzdtsts"
    }
})

const register = async (req, res) => {
    const { name, email, password } = req.body
    const getUser = await user.findOne({ email })

    if (getUser) {
        return res.status(400).json({
            "status": false,
            "message": "User Already Exists..."
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

    var message = {
        from: '"ADMIN TEAM" <admin@mail.com>',
        to: newUser.email,
        subject: "User Account Verification",
        html: verifyTemplate({
            url: "http://localhost:3000",
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
        "data": "signup successfully"
    })
}

const resendMail = async (req, res) => {
    const { email } = req.body
    const getUser = await user.findOne({ email })
    if (getUser) {
        const token = jwt.sign({ id: getUser._id, email: getUser.email }, process.env.TOKENID, { expiresIn: "10m" })

        let message = {
            from: '"ADMIN TEAM" <admin@mail.com>',
            to: getUser.email,
            subject: "User Account Verification",
            html: verifyTemplate({
                url: "http://localhost:3000",
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
            "message": "User Not Found..."
        })
    }

    res.status(200).json({
        "status": true,
        "data": "Mail Sent Successfully!"
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
                    "message": "token expired"
                })
            }
            const { id } = getToken
            const getUser = await user.findById(id)
            if (getUser) {
                if (getUser.verifyStatus == "success") {
                    return res.status(400).json({
                        "status": false,
                        "message": "user already verified"
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
                    "message": "user not exists"
                })
            }
        }
        return res.status(200).json({
            "status": true,
            "data": "token verified successfully"
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
module.exports = { register, resendMail, activate }
const signup = require("../models/signup")
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

require("dotenv/config")

const nodemailer = require("nodemailer")
const handlebars = require("handlebars")
const fs = require("fs")
const path = require("path")

const indexFile = fs.readFileSync(path.resolve(__dirname,"../views/index.handlebars"),'utf8')

const verifyTemplate = handlebars.compile(indexFile)
let transport = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:"rithisathaiyan@gmail.com",
        pass:"wtvpgrjbubzdtsts"
    }
})

const register = async(req,res)=>{
    const {name,email,password,confirmPassword} = req.body
    const getUser = await signup.findOne({email})

    if(getUser){
        return res.status(400).json({
            "status":false,
            "message":"User Already Exists..."
        })
    }

    const encryptPassword = bcrypt.hash(password,10)

    const newUser = new signup({
        name,
        email,
        password:encryptPassword.toString(),
        verifyStatus:"pending"
    })
    await newUser.save()

    const token = jwt.sign({id:newUser._id,email:newUser.email},process.env.TOKENID,{expiresIn:"5m"})

    var message = {
        from: '"ADMIN TEAM" <admin@mail.com>',
        to:newUser.email,
        subject: "User Account Verification",
        html:verifyTemplate({
            url:"http://localhost:3003",
            token:token
        })
    }
    transport.sendMail(message,(err)=>{
        if(err){
            console.log(err)
        }
        else{
            console.log("Mail Sent!")
        }
    })

    res.status(200).json({
        "status":true,
        "token":token
    })
}

const resendMail = async(req,res)=>{
    const {email} = req.body

    const getUser = await signup.findOne({email})

    if(getUser){
        const token = jwt.sign({id:getUser._id,email:getUser.email},process.env.TOKENID,{expiresIn:"10m"})

        var message = {
            from: '"ADMIN TEAM" <admin@mail.com>',
            to: getUser.email,
            subject: "User Account Verification",
            html:verifyTemplate({
                url:"http://localhost:3003",
                token:token
            })
        }
        transport.sendMail(message,(err)=>{
            if(err)
                console.log(err)
            else    
                console.log("Mail Sent!")
        })
        
        await signup.findByIdAndUpdate(getUser.id,{
            $set:{
                verifyStatus:"Success"
            }
        })
    }
    else{
        return res.status(400).json({
            "status":false,
            "message":"User Not Found..."
        })
    }

    res.status(200).json({
        "status":true,
        "message":"Mail Sent Successfully!"
    })
}

module.exports = {jwt,bcrypt,signup,register,resendMail}
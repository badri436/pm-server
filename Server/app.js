const express = require('express')
const cors = require('cors')
const app = express()
const corsOptions ={
    origin:'*', 
    credentials:true,            
    optionSuccessStatus:200
}

const authRoute = require('./routes/authRoute')
const projectRoute = require('./routes/projectRoute')
const taskRoute = require('./routes/taskRoute')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv/config')

app.use(bodyParser.json({urlencoded:true}))
app.use("/auth",cors(corsOptions),authRoute)
app.use("/project",cors(corsOptions),projectRoute)
app.use("/task",cors(corsOptions),taskRoute)

mongoose.connect(process.env.MONGODB,(err)=>{
    if(!err)
        console.log("Database Connected")
    else
        console.log(err)
})
app.listen(process.env.PORT,(err)=>{
    if(!err)
        console.log("Server Started")
})

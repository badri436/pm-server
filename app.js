const express = require('express')
const cors = require('cors')
const app = express()
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions));
const authRoute = require('./routes/authRoute')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv/config')

app.use(bodyParser.json({ urlencoded: true }))
app.use("/auth", authRoute)

mongoose.connect(process.env.MONGODB, (err) => {
    if (!err)
        console.log("Database Connected")
    else
        console.log(err)
})
app.listen(process.env.PORT, (err) => {
    if (!err)
        console.log("Server Started")
})

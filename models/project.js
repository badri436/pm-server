const mongoose = require('mongoose')

const projectSchema = mongoose.Schema({
    projectName:{
        type: String,
        required: true
    },
    percentage:{
        type:Number,
        required: false
    },
    owner:{
        type: String,
        required:true
    },
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"user"
    },
    projectStatus:{
        type:String,
        required: true
    }, 
    tags:{
        type:String,
        required: false
    },
    startDate:{
        type: String,
        required: true
    },
    endDate:{
        type: String,
        required: true
    },
    status:{
        type: Number,
        default: 1
    }
},{ timestamps: true })

module.exports = mongoose.model("project", projectSchema)
require("dotenv/config")
const jwt = require('jsonwebtoken')

const verifyToken = async(req,res,next) => {
    try{
        const token = req.headers["x_access_token"]
        if(token){
            const decoded = jwt.verify(token,process.env.TOKENID)
            if(decoded){
                req.user = decoded
                
            }
            else{
                return res.status(400).json({
                    "status":false,
                    "message":"Invalid Token"
                })
            }
            
        }
        else{
            return res.status(400).json({
                "status":false,
                "message":"Invalid Token"
            })
        }
        return next()
    }catch(error){
        return res.status(400).json({
            "status":false,
            "message":"Invalid Token"
        })
    }
}

module.exports = verifyToken
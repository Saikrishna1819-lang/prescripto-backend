import jwt from "jsonwebtoken"

const authDoctor=async(req,res,next)=>{
    try{
        const {dtoken}=req.headers
        console.log(dtoken)
    if(!dtoken){
        return res.json({success:false,message:"Not Autthorized "})

    }
    const token_decode=jwt.verify(dtoken,process.env.JWT_SECRET)
    
    req.docId=token_decode.id
    
    next()
    } catch(error){
        
        res.json({success:false,message:error.message})
    }



}

export default authDoctor
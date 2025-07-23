import doctormodel from "../models/doctorModel.js"

const changeAvailablity=async(req,res)=>{
    try{
        const {docId}=req.body
    const docData=await doctormodel.findById(docId)
    await doctormodel.findByIdAndUpdate(docId,{available:!docData.available})
    res.json({success:true,message:'Availablity Changed'})
    }catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }
}
const doctorList=async(req,res)=>{
    try{
        const doctors=await doctormodel.find({}).select(['-email','-password'])
        res.json({success:true,doctors})
    }catch(error){
         console.log(error)
        res.json({success:false,message:error.message})
    }
}

export {changeAvailablity,doctorList}
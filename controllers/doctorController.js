import doctormodel from "../models/doctorModel.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import appointmentModel from "../models/appointmentModel.js"
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

const doctorLogin=async(req,res)=>{
   try {
     const {email,password}=req.body
    const doctor=await doctormodel.findOne({email})
    if(!doctor){
            res.json({success:false,message:"Invalid Credentials"})

    }
    const isMatch=await bcrypt.compare(password,doctor.password)
    if(isMatch){
        const token=jwt.sign({id:doctor._id},process.env.JWT_SECRET)
        res.json({success:true,token})
    }
    else
    {
        res.json({success:false,message:"Invalid Credentials"})
    }
   } catch (error) {
    console.log(error)
    
     res.json({success:false,message:error.message})
   }

}

const appointmentsDoctor=async(req,res)=>{
    try {
        const {docId}=req
    const appointments=await appointmentModel.find({docId})
    res.json({success:true,appointments})
    } catch (error) {
         console.log(error)
    
     res.json({success:false,message:error.message})
    }     
}

const appointmentComplete=async(req,res)=>{
    try {
        const {docId}=req
        const {appointmentId}=req.body
    const appointmentsData=await appointmentModel.findById(appointmentId)
    if(appointmentsData&& appointmentsData.docId===docId){
        await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted:true})
        return res.json({success:true,message:"Appointmemt Completed"})
    }
    else
    {
        return res.json({success:false,message:"Mark Failed"})
    }
    } catch (error) {
         console.log(error)
     res.json({success:false,message:error.message})
        
    }

}
const appointmentCanceled=async(req,res)=>{
    try {
        const {docId}=req
        const {appointmentId}=req.body
        console.log(docId)
        
        
    const appointmentsData=await appointmentModel.findById(appointmentId)
    
    if(appointmentsData&& appointmentsData.docId===docId){
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
        return res.json({success:true,message:"Appointmemt Cancelled Succesfully"})
    }
    else
    {
        return res.json({success:false,message:"Cancellation  Failed"})
    }
    } catch (error) {
         console.log(error)
         res.json({success:false,message:error.message})
        
    }

}

const doctorDashboard=async(req,res)=>{
   try {
    const {docId}=req
     const appointments=await appointmentModel.find({docId})
    let earnings=0
    appointments.map((item)=>{
        if(item.isCompleted||item.payment){
            earnings+=item.amount
        }
})

 let patients=[]
 appointments.map((item)=>{
    if(!patients.includes(item.userId)){
        patients.push(item.userId)
    }
 })
 const dashData={
    earnings,appointments:appointments.length,
    patients:patients.length,
    latestAppointments:appointments.reverse().slice(0,5)
 }
 res.json({success:true,dashData})
 
   } catch (error) {
     console.log(error)
     res.json({success:false,message:error.message})
   }

}

const doctorProfile=async(req,res)=>{
   try{
     const {docId}=req
    const profileData=await doctormodel.findById(docId).select('-password')
    res.json({success:true,profileData})
   }
   catch(error){
     console.log(error)
     res.json({success:false,message:error.message})
   }
}

const updateDoctorProfile=async(req,res)=>{
    try {
        const {docId}=req
    const {fees,address,available}=req.body
    await doctormodel.findByIdAndUpdate(docId,{fees,address,available})
    res.json({success:true,message:"Profile Updated"})
    } catch (error) {
      console.log(error)
     res.json({success:false,message:error.message})   
    }

}

export {changeAvailablity,doctorList,doctorLogin,appointmentsDoctor,appointmentComplete,appointmentCanceled,doctorDashboard,doctorProfile,updateDoctorProfile}
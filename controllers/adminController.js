import validator from "validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import {v2 as cloudinary} from "cloudinary"
import doctormodel from '../models/doctorModel.js'
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"
const addDoctor=async(req,res)=>{
    try{
        const {name,email,password,speciality,degree,experience, about,fees,address,available }=req.body
        const imageFile=req.file
        if(!name||!email||!password||!speciality||!degree||!experience||!about||!fees||!address)
        {
            return res.json({success:false,message:"Missing Details"})
        }

        // validate the email using validator
        if(!validator.isEmail(email))
        {
            return res.json({success:false,message:"Email is not valid"})

        }
        if(password.length<8){
            return res.json({success:false,message:"Please enter a strong password"})

        }
        // hashing doctor password
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)
        
        // upload image in cloudinary
        const imageUpload=await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})
        const imageUrl=imageUpload.secure_url

        const doctorData={
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            available,
            address:JSON.parse(address),
            date:Date.now()
        }

        const newDoctor=new doctormodel(doctorData)
        await newDoctor.save()
        res.json({success:true,message:"Doctor added sucessfully"})


    } catch(error){
        console.log(error)
        res.json({success:false,message:error.message})

        

    }

}

const loginAdmin=async(req,res)=>{
  try{
      const {email,password}=req.body
      console.log(email)
      console.log(password)
    if(email===process.env.ADMIN_EMAIL&& password===process.env.ADMIN_PASSWORD)
    {
        const token=jwt.sign(email+password,process.env.JWT_SECRET)
        res.json({success:true,token})
    }
    else
    {
        res.json({success:false,message:"Invalid credentials"})
    }
  } catch(error){
    res.json({success:false,message:error.message})
  }
    
}

// Api to get all the doctors list for admin panel

const allDoctors=async(req,res)=>{
    try{
        const doctors=await doctormodel.find({}).select('-password')
        res.json({success:true,doctors})
    } catch(error){
    res.json({success:false,message:error.message})
  }

 
    
}
 const appointmentsAdmin=async(req,res)=>{
   try {
     const appointments=await appointmentModel.find({})
    res.json({success:true,appointments})
   } catch (error) {

    res.json({success:false,message:error.message})
   }

  }

  const appointmentCancel=async(req,res)=>{
 try {
  
  const {appointmentId}=req.body
  const appointmentData=await appointmentModel.findById(appointmentId)

  
  await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
  const {docId,slotDate,slotTime}=appointmentData
  const doctorData=await doctormodel.findById(docId)
  let slots_booked=doctorData.slots_booked
  slots_booked[slotDate]=slots_booked[slotDate].filter(e=> e!==slotTime)
  await doctormodel.findByIdAndUpdate(docId,{slots_booked})
  res.json({success:true,message:"Appointment Cancelled"})

 } catch (error) {
  res.json({success:false,message:error.message})
  }
 }


 const adminDashboard=async(req,res)=>{
    const doctors=await doctormodel.find({})
    const users=await userModel.find({})
    const appointments=await appointmentModel.find({})
    const dashData={
        doctors:doctors.length,
        patients:users.length,
        appointments:appointments.length,
        latestAppointments:appointments.reverse().slice(0,5)
    }
    res.json({success:true,dashData})

 }

export {addDoctor,loginAdmin,allDoctors,adminDashboard,appointmentsAdmin,appointmentCancel} 
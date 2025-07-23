import validator from "validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import {v2 as cloudinary} from "cloudinary"
import userModel from "../models/userModel.js"
import doctormodel from "../models/doctorModel.js"
import razorpay from "razorpay"
import appointmentModel from "../models/appointmentModel.js"
const registerUser  =async(req,res)=>{
    try{
        const {name,email,password}=req.body
    if(!name||!email||!password){
        return res.json({success:false,message:"Missed Details"})
    }
    if(!validator.isEmail(email)){
        return res.json({success:false,message:"Enter a valid email"})
    }
    if(password.length<8){
        return res.json({success:false,message:"Enter a strong password"})

    }

    const salt=await bcrypt.genSalt(10)
    const hashPassword=await bcrypt.hash(password,salt)

    const userData={
        name,email,password:hashPassword
    }

    const newUser=new userModel(userData)
    const user=await newUser.save()
    const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
    res.json({success:true,token})
    } catch(error){
        console.log(error)
        res.json({sucess:false,message:error.message})
    }

}

const loginUser=async(req,res)=>{
   try{
     const {email,password}=req.body
    const user=await userModel.findOne({email})
    if(!user){
        return res.json({success:false,message:"User does not exist"})

    }
    const isMatch=await bcrypt.compare(password,user.password)
    if(isMatch){
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
        res.json({success:true,token})
    }
    else{
        res.json({success:false,message:"Invalid credentials"})
        
    } 
   } catch(error){
    res.json({success:false,message:error.message})
   }

}

const getProfile=async(req,res)=>{
  try{
      const userId=req.userId
      const userData=await userModel.findById(userId).select('-password')
      res.json({success:true,userData})
  }
  catch(error){
    console.log(error)
    res.json({success:false,message:error.message})
  }

}

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, address, dob, gender } = req.body;
    const imagefile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Missing data" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const updateData = {
      name,
      phone,
      dob,
      gender,
    };

    try {
      updateData.address = typeof address === "string" ? JSON.parse(address) : address;
    } catch {
      return res.json({ success: false, message: "Invalid address format" });
    }

    if (imagefile) {
      const imageUpload = await cloudinary.uploader.upload(imagefile.path, {
        resource_type: "image",
      });
      updateData.image = imageUpload.secure_url;
    }

    await userModel.findByIdAndUpdate(userId, updateData);
    res.json({ success: true, message: "Profile updated" });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
}

const bookAppointment=async(req,res)=>{
  try {
    const {docId,slotDate,slotTime}=req.body
    const userId=req.userId
   
    

    const docData=await doctormodel.findById(docId).select('-password')
    if(!docData.available){
      return res.json({success:false,message:"doctor not available"})

    }
    let slots_booked=docData.slots_booked
    if(slots_booked[slotDate]){
      if(slots_booked[slotDate].includes(slotTime)){
        return res.json({success:false,message:"Slot not available"})

      }
      else
      {
        slots_booked[slotDate].push(slotTime)
      }
    }
    else
    {
      slots_booked[slotDate]=[]
      slots_booked[slotDate].push(slotTime)
    }
    const userData=await userModel.findById(userId).select('-password')
    delete docData.slots_booked
    const appointmentData={
      userId,
      docId,
      userData,
      docData,
      amount:docData.fees,
      slotTime,
      slotDate,
      date:Date.now()
    }
    // console.log(appointmentData)
    const newAppointment=new appointmentModel(appointmentData)
    await newAppointment.save();
    await doctormodel.findByIdAndUpdate(docId,{slots_booked})
    res.json({success:true,message:"Appointment booked"})
  } catch (error) {

     res.json({success:false,message:error.message})
  }

  

}

const listAppointment=async(req,res)=>{
  try{
    const userId=req.userId
    const appointments=await appointmentModel.find({userId})
    res.json({success:true,appointments})
  }catch(error){
    res.json({success:false,message:error.message})
  }

}
const cancelAppointment=async(req,res)=>{
 try {
   const userId=req.userId
  const {appointmentId}=req.body
  const appointmentData=await appointmentModel.findById(appointmentId)
  // verify application user
  if(appointmentData.userId!==userId){
    return res.json({success:"false",message:"Unauthorized action"})

  }
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

 const razorpayInstance=new razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_SECRET
 })

//   api to make payment of appointment using razorpay

const paymentRazorpay=async(req,res)=>{
  try {
    console.log("sai krishna")
    const {appointmentId}=req.body
  const appointmentData=await appointmentModel.findById(appointmentId)
  if(!appointmentData|| appointmentData.cancelled){
    return res.json({success:false,message:"Appointment Cancelled o not found"})

  }

  const options={
    amount:appointmentData.amount*100,
    currency:process.env.CURRENCY,
    receipt:appointmentId, 
  }
  const order=await razorpayInstance.orders.create(options)
  res.json({success:true,order})
  
  } catch (error) {
    res.json({success:false,message:error.message})
  }
}



export {registerUser,loginUser,getProfile,updateProfile,bookAppointment,listAppointment,cancelAppointment,paymentRazorpay}
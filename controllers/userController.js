import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'


//API for registering user
const registerUser=async(req,res)=>{

    try {
        const {name,email,password}=req.body

        
        //checking for all data to add doctor

        if(!name || !email || !password  ){

            return res.json({success:false,message:"Missing Details"})
        }
        
        //validating email
        if(!validator.isEmail(email)){
            return res.json({success:false,message:"Please enter a valid email"})
        }
        
        //validating strong password
        if(password.length<8){
            return res.json({success:false,message:"Please enter a strong password"})
        }
        
        const isUserExist=userModel.find({email})
        if(isUserExist){
            return res.json({success:false,message:"User with same email exists"})
        }

        //hashing doctors password
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)

        const userData={
            name,
            email,
            password:hashedPassword,
            date:Date.now()
        }

        const newUser=new userModel(userData)
        const user= await newUser.save()

        const token=jwt.sign({id:user._id},process.env.JWT_SECRET)


        res.json({token,success:true,message:"User registered"})
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
        
    }
}

//api for admin login

const loginUser=async(req,res)=>{
    try {
        const{email,password}=req.body
        
        const user=await userModel.findOne({email})
        
        if(!user){
          return  res.json({success:false,message:"User does not exist"})
        }
        
        const isMatch=await bcrypt.compare(password,user.password)
        
        if(isMatch){
            const token=jwt.sign({id:user._id},process.env.JWT_SECRET)
            res.json({success:true,token})
        }
        else{
            res.json({success:false,message:"Invalid Credentials"})
        }


    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

const getProfile=async(req,res)=>{
    try {
        const userId=req.userId
        const userData=await userModel.findById(userId).select('-password')

        res.json({success:true,userData})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

const updateProfile=async(req,res)=>{
    try {
        
        const userId=req.userId
        const{name,phone,address,dob,gender}=req.body
        const imageFile=req.file

        if(!name || !phone || !address || !dob || !gender){
            return res.json({success:false,message:"Data missing"})
        }

        await userModel.findByIdAndUpdate(userId,{name,phone,address:JSON.parse(address),dob,gender})

        if(imageFile){
            const imageUpload=await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
            const imageURL= imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId,{image:imageURL})
        }

        res.json({success:true,message:"Profile Updated"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

const bookAppointment=async(req,res)=>{
    try {
        const userId=req.userId
        const{docId,slotDate,slotTime}=req.body

        const docData=await doctorModel.findById(docId).select('-password')        

        if(!docData.available){
            return res.json({success:false,message:"Doctor not available"})
        }
        let slots_booked=docData.slots_booked
        
        //check availability of  slots
        
        if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes[slotTime]){
                return res.json({success:false,message:"Slot not available"})
            }
            else{
                slots_booked[slotDate].push(slotTime)
            }
        }
        else{
            slots_booked[slotDate]=[]
            slots_booked[slotDate].push(slotTime)
        }

        const userData=await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData={
            userId,docId,userData,docData,amount:docData.fees,slotTime,slotDate,date:Date.now()
        }

        const newAppointment=new appointmentModel(appointmentData)

        await newAppointment.save()

        //save new slot booked in doctor data
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})

        res.json({success:true,message:"Appointment Booked"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}


//api to get appointment
const listAppointment=async(req,res)=>{
    try {
        const userId=req.userId
        const appointments=await appointmentModel.find({userId})

        res.json({success:true,appointments})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

const cancelAppointment=async(req,res)=>{
    try {
        const userId=req.userId
        const {appointmentId}=req.body

        const appointmentData=await appointmentModel.findById(appointmentId)
        
        if(appointmentData.userId!==userId){
            return res.json({success:false,message:"Unauthorized action"})
        }
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        //release doctor slot

        const {docId,slotDate,slotTime}=appointmentData

        const doctorData=await doctorModel.findById(docId)

        let slots_booked=doctorData.slots_booked

        slots_booked[slotDate]=slots_booked[slotDate].filter(e=> e!==slotTime)

        await doctorModel.findByIdAndUpdate(docId,{slots_booked})

        res.json({success:true,message:"Appointment cancelled"})
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//payment

const razorpayInstance=new razorpay({
    key_id:process.env.RZP_KEY_ID,
    key_secret:process.env.RZP_KEY_SECRET
})

const paymentRazorpay=async(req,res)=>{
    try {
        const {appointmentId}=req.body
        const appointmentData=await appointmentModel.findById(appointmentId)

        if(!appointmentData||appointmentData.cancelled){
            return res.json({success:false,message:"Appointment cancelled or not found"})
        }

        //creating options for razorpay payment
        const options={
            amount:appointmentData.amount*100,
            currency:process.env.CURRNENCY,
            receipt:appointmentId
        }

        //creation of an order
        const order =await razorpayInstance.orders.create(options)
        console.log(order,"ooooooooooo");
        
        res.json({success:true,order})

    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//api to verify payment

const verifyRazorpay=async(req,res)=>{
    try {
        
        
        const {razorpay_order_id}=req.body
               razorpay_order_id
        const orderInfo=await razorpayInstance.orders.fetch(razorpay_order_id)

        if(orderInfo.status==="paid"){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
            res.json({success:true,message:"Payment Successful"})
        }else{
            res.json({success:true,message:"Payment failed"})
        }
        
    } catch (error) {
        res.json({success:false,message:error.message})        
    }
}


export {registerUser,loginUser,getProfile,updateProfile,listAppointment,bookAppointment,cancelAppointment,paymentRazorpay,verifyRazorpay}
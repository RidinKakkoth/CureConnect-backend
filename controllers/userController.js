import validator from 'validator'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'


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



export {registerUser,loginUser,getProfile,updateProfile,listAppointment,bookAppointment}
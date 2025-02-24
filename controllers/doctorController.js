import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js";

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;

        if (!docId) {
            return res.status(400).json({ success: false, message: "Doctor ID is required" });
        }

        const updatedDoctor = await doctorModel.findByIdAndUpdate(
            docId,
            [{ $set: { available: { $not: "$available" } } }],
            { new: true } 
        );

        if (!updatedDoctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        res.json({ success: true, message: "Availability changed", doctor: updatedDoctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//get all doctors

const doctorList=async(req,res)=>{
    try {

        const doctors=await doctorModel.find({}).select(['-password','-email'])        

        res.json({success:true,doctors})


    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api call for doctor login

const loginDoctor=async(req,res)=>{
    try {
        const {email,password}=req.body
        const doctor=await doctorModel.findOne({email})

        if(!doctor){
            return res.json({success:false,message:"Invalid credentials"})
        }
        
        const isMatch=await bcrypt.compare(password,doctor.password)
        if(isMatch){
            const token=jwt.sign({id:doctor._id},process.env.JWT_SECRET)
            res.json({success:true,token})
        }else{
            return res.json({success:false,message:"Invalid credentials"})
        }
        
    } catch (error) {
        res.json({success:false,message:error.message}) 
    }
}


//api to get all appointments of this doctor
const appointmentsDoctor=async(req,res)=>{
    try {
        const docId=req.docId
        const appointments=await appointmentModel.find({docId})
        
        res.json({success:true,appointments})
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api to mark completed appointment from doctor panel

const appointmentComplete=async(req,res)=>{
    try {
        const docId=req.docId
        const{appointmentId}=req.body
        const appointmentData=await appointmentModel.findById(appointmentId)
        
        if(appointmentData&&appointmentData.docId===docId){
        
            await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted:true})
          return res.json({success:true,message:"Appointment Completed"})
          
        }else{
            return res.json({success:false,message:"Mark Failed"})
        }
        
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}
//api to mark cancelled appointment from doctor panel

const appointmentCancel=async(req,res)=>{
    try {
        const docId=req.docId
        const{appointmentId}=req.body
        const appointmentData=await appointmentModel.findById(appointmentId)
        
        if(appointmentData&&appointmentData.docId===docId){
        
            await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})
          return res.json({success:true,message:"Appointment Cancelled"})
          
        }else{
            return res.json({success:false,message:"Cancellation Failed"})
        }
        
    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//api to get dashboard data for doctor panel

const doctorDashboard=async(req,res)=>{
    try {
        const docId=req.docId
        
        const appointments=await appointmentModel.find({docId})

        let earnings=0
       await appointments.map((item,index)=>{
            if(item.isCompleted||item.payment){
                earnings+=item.amount
            }
        })
        let patients=[]
       await appointments.map((item,index)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })
        const dashData={
            earnings,
            appointments:appointments.length,
            patients:patients.length,
            latestAppointments:appointments.reverse().slice(0,5)
        }
        res.json({success:true,dashData})

    } catch (error) {
        res.json({success:false,message:error.message})
    }
}

//api to get doctor profile for doctor panel

const doctorProfile=async(req,res)=>{
    try {
        
        const docId=req.docId
        const profileData=await doctorModel.findById(docId).select('-password')
        res.json({success:true,profileData})
    } catch (error) {
       res.json({success:false,message:error.message})
   }
}
//api to update doctor profile for doctor panel

const updateDoctorProfile=async(req,res)=>{
    try {
        
        const docId=req.docId
        const{fees,address,available}=req.body
        await doctorModel.findByIdAndUpdate(docId,{fees,address,available})
        res.json({success:true,message:"Profile Updated"})
    } catch (error) {
       res.json({success:false,message:error.message})
   }
}



export { changeAvailability,doctorList,loginDoctor,appointmentsDoctor,appointmentComplete,appointmentCancel,doctorDashboard,updateDoctorProfile,doctorProfile };

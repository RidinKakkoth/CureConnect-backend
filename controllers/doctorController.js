import doctorModel from "../models/doctorModel.js";

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



export { changeAvailability,doctorList };

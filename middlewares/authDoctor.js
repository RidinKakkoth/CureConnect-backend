import jwt from 'jsonwebtoken'


//doctor authentication 

const authDoctor=async(req,res,next)=>{
    try {
   
        const authHeader = req.headers.authorization;
        
        const token = authHeader && authHeader.split(' ')[1];

        if(!token){
            return res.json({success:false,message:"Not Authorized Login Again"})
        }
        const token_decode=jwt.verify(token,process.env.JWT_SECRET)
        
        req.docId=token_decode.id
        
        next()

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}


export default authDoctor
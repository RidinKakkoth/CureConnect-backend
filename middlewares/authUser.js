import jwt from 'jsonwebtoken'


//user authentication 

const authUser=async(req,res,next)=>{
    try {
   
        const authHeader = req.headers.authorization;
        
        const token = authHeader && authHeader.split(' ')[1];

        if(!token){
            return res.json({success:false,message:"Not Authorized Login Again"})
        }
        const token_decode=jwt.verify(token,process.env.JWT_SECRET)
        
        req.userId=token_decode.id
        
        next()

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}


export default authUser
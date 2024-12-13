import jwt from 'jsonwebtoken'


//admin authentication 

const authAdmin=async(req,res,next)=>{
    try {
   
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        
        if(!token){
            return res.json({success:false,message:"Not Authorized Login Again"})
        }
        const token_decode=jwt.verify(token,process.env.JWT_SECRET)
        
        if(token_decode!==process.env.ADMIN_EMAIL+process.env.ADMIN_PASSWORD){
            return res.json({success:false,message:"Not Authorized Login Again"})
        }

        next()

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}


export default authAdmin
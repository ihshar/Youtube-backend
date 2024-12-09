import dotenv from "dotenv"
import express from "express"
import connectDB from "./db/index.js";
const app = express();

dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.on("ERROR ",(error)=>{
        console.log("ERROR is App Listening:"),error;
        throw error;
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is listening at PORT: ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MONGODB connection failed!!!",error);
})




export {app}














/*

;(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    }
    catch(error){
        console.log("ERROR:", error);
        throw err  
    }
})()

*/
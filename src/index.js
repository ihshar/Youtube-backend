import dotenv from "dotenv"
import express from "express"
import connectDB from "./db/index.js";
const app = express();

dotenv.config({
    path:'./env'
})

connectDB()
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
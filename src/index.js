import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config(
    {
        path: "./.env"
    }
);




connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });

    app.on("error", (error) => {
        console.log(`Error: ${error}`);
        throw error
    })
}).catch((error) => {
    console.log("Mongodb connection failed in the Promise Handled", error);
    process.exit(1);
});




/* import express from "express";
const app=express();

(async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log(`Error: ${error}`);
            throw error
        })
        app.listen(`${process.env.PORT}`, ()=>{
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        
    }
})()
 */

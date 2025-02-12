import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {
    try {
        const mongooseConnectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected!! DB HOST ${mongooseConnectionInstance.connection.host}`);

    } catch (error) {
        console.log("MONGODB connection error gets error while connection to DB", error);
        process.exit(1);
    }
}

export default connectDB;
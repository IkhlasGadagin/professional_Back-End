import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

//everything frontend sends to backend is in json format express converts to json
app.use(express.json({
    limit: "16kb"
}));

//the complex url is decoded by the express and stored in req.body
app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"));

app.use(cookieParser());


import userRoute from "./routes/user.routes.js";

app.use("/api/v1/user", userRoute);


export { app };
import mongoose from "mongoose";

const PlaylistSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: true
        },
        description: {
            type: String,
            require: true
        },
        videos: [{
            type: mongoose.Schema.type.ObjectId,
            ref: "Video"
        }],
        owner: {
            type: mongoose.Schema.type.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    })

export const PlaylistModel = mongoose.model("PlaylistModel", PlaylistSchema) 

import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String, //cloudinery video string by multer
            required: true,
        },
        thumbnail: {
            type: String, //cloudinery image string by multer
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,  //by cloudenery we will get time too
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true
    });

VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", VideoSchema);
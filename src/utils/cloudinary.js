import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        fs.unlinkSync(localFilePath); //remove the file from our directory after uploading on cloud
        // console.log(response.url, "file uploaded on cloudenery");
        return response;              //return the response of cloudenery server

    } catch (error) {
        fs.unlinkSync(localFilePath); //remove if the currepted file came from cloudenery server to our directory       
        return null
    }
}
export { uploadOnCloudinary };
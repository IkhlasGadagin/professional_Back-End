# the main aim of this project is to build standard proffessional project for everything

the project includes how the folder structure is to be set according to the requirement 

usee of the model design from the erase.io

key points and dotenv Prettier nodemon express monogosse src index.js app.js app use 
db, model, middleware, route, utils,  

the database is in another continent so use async and await to connect mongodb and handle error 

the express.js must be in in the app.js 

the middleware must be written in the app.js file like cors cookie-parcer etc..
express will convert all the data into jsonformat expect files   ..(multer does)

use of utils folder to achieve standard like asyncHandler highorder funvtion Promise

the 2 models is created in the model folder that has  mongoose hooks for generate access, refresh and also isPasswordCorrect and hooks pre 
And before saving bcrypt and save the password also we can validate the password 

In the Video model aggegration pipeline is used to manage the mongooseAggregatePaginate 

create cloudenary account to use it followed by the multer 

started to build the controller via through app.js 

registration is done in the user.controller.js apart from refresToken and watchHistry []

use of POSTMAN send data for testing formdata  used to send files too

handled all the data for the all the inputs also for empty image too in register includes coverImage 

after Register user login with same credentails valid and generate tokens verify and send as cookie too

Registration, Login, Logout(with middleware user next()) refreshtoken acces when expried, change password, getCurentuser by middleware,  update All the credentials with middleware and with findByIdAndUpdate(req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },

        { new: true }).select("-password -refreshToken")

FOR IMAGE UPDATE PLEASE KEEP SEPERATE API FOR ONLY FOR THE IMAGE VIA THROUGH CLOUDENERY SO

User Aggegration pipeline is done in the controller of user 
tke user name make match with username
lookup from localField foreign \Filed as
$addFields to add the extra field 
 $project tell what to send fields that is need to be send for frontend 

caution : that the mongoose converts the mongodb string OBjectId into normal ID which is done by the mongoose 

There is doubt there is no aggegration pipe line in the user Model??//

let mongoose=require("mongoose");
mongoose.connect("mongodb+srv://pratikchindhe44:pratik123@cluster0.z8syx.mongodb.net/musicapp")
let Schema=mongoose.Schema;
let User_Schema=new Schema({
    "name":String,
    "email":String,
    "mobile":Number,
    "password":String,
    "joined":Date,
    "liked_song":{"type":[String],default:[]}
})
module.exports=mongoose.model("User",User_Schema);

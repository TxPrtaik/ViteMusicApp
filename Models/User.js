let mongoose=require("mongoose");
mongoose.connect("mongodb://localhost:27017/musicapp")
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

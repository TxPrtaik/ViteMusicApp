let mongoose=require("mongoose")
let Schema=mongoose.Schema;
let playlist=new Schema({
    "name":String,
    "discription":String,
    "userId":String,
    "songs":[String],
    "creation_date":Date
})
module.exports=mongoose.model("playlist",playlist);
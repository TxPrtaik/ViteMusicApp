let mongoose=require("mongoose")
let Schema=mongoose.Schema;
let music=new Schema({
    "music":String,
    "thumbnail":String,
    "title":String,
    "singer":String,
    "duration":Number,
    "tags":[],
    "upload_date":Date,
    "likes":{type:Number,default:0}
})

module.exports=mongoose.model("Music",music);
let express=require("express");
let app=express();
let jwt=require("jsonwebtoken");
let cors=require("cors");
let upload=require("express-fileupload");
let userRoute=require("./routes/User");
let bodyparser=require("body-parser");
app.use(bodyparser.urlencoded({extended:true}));
app.use(cors({
    origin: "*",
    credentials: true
}));
app.use(upload());
app.use(express.json())
app.use(express.static("public/"))
app.use("/api",userRoute)
app.listen(5000,()=>{
    console.log("Server is running on port 5000")
})

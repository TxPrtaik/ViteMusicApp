let express=require("express");
let router=express.Router();
let jwt=require("jsonwebtoken");

let userschema=require("../Models/User")
let playlistSchema=require("../Models/Playlist")
let musicSchema=require("../Models/Music")
function verifyToken(req,res,next) {
    let token=req.headers.authorization;
    if(!token){
        res.status(400).json({message:"Token missing"})
    }else{
    token=token.split(" ")[1];
   let user= jwt.verify(token,"pratik@123");
   req.user=user;
   next();
    }
}



router.post("/auth/register",async(req,res)=>{
let {name,email,mobile,password}=req.body;
let exist=await userschema.find({$or:[{email:email},{mobile:mobile}]});
if(exist.length!=0){
          res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email or mobile' 
      });
}
else{
let saved=await userschema({"name":name,"email":email,"mobile":mobile,"password":password,"liked_song":0,"joined":new Date().toISOString()}).save();
let token=jwt.sign({"userId":saved._id},"pratik@123",{expiresIn:"10h"});
res.status(200).json({
    success:true,
    token,
    user:{"id":saved._id,"name":name,"email":email,"mobile":mobile}
})
}
})

router.post("/auth/login",async(req,res)=>{
    let {email,password}=req.body;
   let verify= await userschema.findOne({email:email,password:password});
if(!verify){
res.status(400).json({
    success:false,
    message:"user not found",
    
})
}
else{
    let token=jwt.sign({userId:verify._id},"pratik@123",{expiresIn:"10h"})
res.status(200).json({
    success:true,
    token,
    user:{"id":verify._id,"name":verify.name,"email":verify.email,"mobile":verify.mobile}
})
}
})

router.get("/profile",verifyToken,async(req,res)=>{
    res.status(200).json({
        "user":await userschema.findById(req.user.userId)
    })
})
router.put("/profile",verifyToken,async(req,res)=>{
    let {name,email,mobile,password}=req.body;
    await userschema.findById(req.user.userId).updateOne({name,email,mobile,password});

    res.status(200).json({
    "success":true})
})

//playlist
router.post("/playlists",verifyToken,async(req,res)=>{
    let {name,description}=req.body;
await playlistSchema({name,description,userId:req.user.userId,"songs":[],creation_date:new Date()}).save()
let playlists=await playlistSchema.find({_id:req.user.userId});
res.status(201).json({playlist:playlists})
})
router.get("/playlists",verifyToken,async(req,res)=>{
let playlists=await playlistSchema.find({userId:req.user.userId});
if(!playlists){
playlists=[]
}
res.status(200).json({success:true,playlist:playlists})
})
router.get("/playlists/:id", verifyToken, async (req, res) => {

  try {

    let playlist = await playlistSchema.findOne({
      _id: req.params.id
    });

    res.status(200).json({
      success: true,
      playlist
    });

  }
  catch (err) {

    res.status(400).json({
      success: false,
      playlist: null
    });

  }

});

router.get("/playlists/:id/songs",verifyToken,async(req,res)=>{
let playlist = await playlistSchema.findById(req.params.id)
let songs=[];
for(let s of playlist.songs ){
let song=await musicSchema.findById(s);
songs.push(song);
}
    res.status(201).json({success:true,"songs":songs})
})
router.get("/music/listening-time",verifyToken,async(req,res)=>{
let playlist=await playlistSchema.find({userId:req.user.userId});
let time=0;
for(let p of playlist){
  for(let s of p.songs){
    let song=await musicSchema.findById(s);
    time+=song.duration
  }
}

res.status(200).json({seconds:time})
})

router.get("/music/liked",verifyToken,async(req,res)=>{
let user=await userschema.findById(req.user.userId);

  let songs=[];
for(let s of user.liked_song ){
  if(s==0){
    continue;
  }
let song=await musicSchema.findById(s);
songs.push(song);
}
    res.status(201).json({success:true,"songs":songs})
})

router.put("/playlists/:id",verifyToken,async(req,res)=>{
    let {name,description}=req.body;
    await playlistSchema.findById(req.params.id).updateOne({name,description});
    res.status(201).json({playlist:await playlistSchema.findById(req.params.id)})
})
router.delete("/playlists/:id",verifyToken,async(req,res)=>{
    await playlistSchema.findById(req.params.id).deleteOne();
    res.status(200).json({"message":"playlist deleted"})
})
router.post("/playlists/:id/add",verifyToken,async(req,res)=>{
let playlist=await playlistSchema.findById(req.params.id);
playlist.songs.push(req.body.songId)
await playlistSchema.findById(req.params.id).updateOne(playlist);
  
  res.status(200).json({"message":"song added to playlist"})
})

router.delete("/playlists/:pid/songs/:sid",verifyToken,async(req,res)=>{
  let playlist=await playlistSchema.findById(req.params.pid);
  playlist.songs.splice(playlist.songs.indexOf(req.params.sid),1);
  await playlistSchema.findById(req.params.pid).updateOne(playlist)
  res.status(200).json({success:true});
})
router.get("/playlists/user/:id",verifyToken,async(req,res)=>{
  
  let playlist=await playlistSchema.findById(req.params.id);
  res.status(200).json({"success":true,"user":await userschema.findById(playlist.userId)});
})
//Music

router.get("/playlists/songs/:id",verifyToken,async(req,res)=>{
  let playlist=await playlistSchema.findById(req.params.id);
  let songs=[];
  for(let p of playlist.songs){
   let s=await musicSchema.findById(p);
   songs.push(s)
  }
  res.status(200).json({"success":true,"songs":songs})
})

router.post("/music/upload",verifyToken,async(req,res)=>{
    let {music,thumbnail}=req.files;
    let musicName=new Date().getTime()+music.name;
    music.mv("./public/music/"+musicName)
    let thumbnailName="";
    if(thumbnail){
    thumbnailName=new Date().getTime()+thumbnail.name;
    thumbnail.mv("./public/thumnail/"+thumbnailName)
    }
    let {title,singer,duration,tags}=req.body;
 tags = tags.slice(1,tags.length-1).split(",").map((i)=>i.slice(1,i.length-1))

   await musicSchema({"music":musicName,"upload_date":new Date().toISOString(),"thumbnail":thumbnailName,"title":title,"singer":singer,"duration":duration,"tags":tags}).save();


res.status(200).json({"message":"Music Uploaded"})
})

router.delete("/music/:id",async(req,res)=>{
  await musicSchema.findById(req.params.id).deleteOne();
  res.status(200).json({"message":"Data deleted Successfully"})
})
router.post("/music/like/:id",verifyToken,async(req,res)=>{
  let user=await userschema.findById(req.user.userId);
  if(!user.liked_song.includes(req.params.id)){
    user.liked_song.push(req.params.id);
    await userschema.findById(req.user.userId).updateOne(user);
   let song= await musicSchema.findById(req.params.id);
   song.likes++;
   await musicSchema.findById(req.params.id).updateOne(song);
res.status(200).json({"success":true})
  }
  else{
res.status(200).json({"success":false})

  }
})
router.delete("/music/like/:id",verifyToken,async(req,res)=>{
  let user=await userschema.findById(req.user.userId);
  user.liked_song.splice(user.liked_song.indexOf(req.params.id),1)
  await userschema.findById(req.user.userId).updateOne(user);
  let song=await musicSchema.findById(req.params.id);
  song.likes--;
  await musicSchema.findById(req.params.id).updateOne(song);
  res.status(200).json({success:true});
})

// Add these endpoints to your backend

// Search music
router.get('/music/search', async (req, res) => {
  try {
    const { q, tags, page = 1, limit = 20 } = req.query;
    let query = {};
    
    // Build search query
    if (q && q.trim()) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { singer: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    // Add tag filter
    if (tags && tags.trim()) {
      const tagArray = tags.split(',');
      if (query.$or) {
        // When both search term and tags are present
        query = {
          $and: [
            { $or: query.$or },
            { tags: { $in: tagArray } }
          ]
        };
      } else {
        // When only tags filter is present
        query.tags = { $in: tagArray };
      }
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute search with pagination
    const results = await musicSchema
      .find(query)
      .sort({ upload_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
  
    // Get total count for pagination
    const totalCount = await musicSchema.countDocuments(query);
    res.json({ 
      success: true, 
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalResults: totalCount,
        hasMore: skip + results.length < totalCount
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get trending searches (based on most searched or most played)
router.get('/api/music/trending',verifyToken, async (req, res) => {
  try {
    // You can implement logic based on search history or play counts
    const trending = ['Rock', 'Pop', 'Hip Hop', 'Jazz', 'Electronic'];
    res.json({ success: true, trending });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/playlists/copy",verifyToken,async(req,res)=>{
let playlist=await playlistSchema.findById(req.body.playlistId);
let {name,description,songs,creation_date}=playlist;
await playlistSchema({name,description,userId:req.user.userId,songs,creation_date}).save();
  res.status(200).json({success:true})
})



module.exports=router;
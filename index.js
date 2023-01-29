const express =require('express')
 const cors=require('cors')
 const bcrypt = require('bcrypt');
 const jwt=require('jsonwebtoken')
 
const saltRounds = 10; 
const mongoose=require('mongoose')
const  bodyParser = require('body-parser');



// const e = require('express');
mongoose.set('strictQuery', true);  

const app=express()
app.use(express.json())
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


// support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded())   //warning
app.use(cors())

mongoose.connect("mongodb://localhost:27017", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, () => {
    console.log("DB connected")
})

const userSchema = new mongoose.Schema({
    name: String,
    
    password: String,
    followers:Array,
    following:Array,
})


const User = new mongoose.model("user", userSchema)

//register with async

app.post("/users",async(req,res)=>{
    const{name,password}=req.body
    const user = await User.findOne({name:req.body.name});
    if(user == null){

   bcrypt.hash(password,saltRounds,(err,hash)=>{
    if(err){
        console.log(err)
    }
    if(hash){
        const user = new User({
            name,
            password:hash
        })
        user.save(err => {
            if(err) {
                res.send(err)
            } else {
                res.send( { message: "Successfully Registered, Please login now." })
            }
        })
    }

   })
      
   }else{
        res.status(404).send({message:"User already registered ."})
    }

})

//bcryot
const generateToken=(user)=>{
    const payload = { user }; // the JWT payload
    const options = { expiresIn: '1h' }; // the JWT options
    const secret="login"
    return jwt.sign(payload, secret, options);

}
app.get('/users/:username', async(req, res) => {
    const name=req.params.username
    const password=req.body.password

     const user = await User.findOne({name:name});
     if(user !== null){
        const verify_password = await bcrypt.compare(password,user.password);
        if(verify_password){
            const token =  generateToken(user);
            // console.log(token)
            // tokent generate to pass in header

            res.send(token)
       
        }else{
            res.status(400).send({message:'Wrong email or password.'});
        }
    }else{
         res.status(404).send({message:"User not found."})
     }

    
  });
//add follower 
const tokenVerify=(token)=>{
    
  if (!token) return res.status(401).send('Access denied. No token provided.');

  try {
    // verify the JWT and extract the payload
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    // console.log(req.user)
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }

}
app.post("/users/:username/follow",async(req,res)=>{
    const name= req.params.username
    const following=req.body.following
    
    // console.log(req.headers.authorization)
    //  const tokenCheck= await tokenVerify(req.headers.authorization)

     
      User.findOne({name:following},(err,value)=>{
        if(err){
            res.send(err)
            return
        }
        if(!value){
            // check="following body user in not registered"
             res.send({message:"following body user in not registered"})
             return

        }

        if(value.followers.includes(name)){
            check=`you are allredy  following ${following}`
             res.send({message:`you are allredy  following ${following}` })
            
            return
        }
        // else{User.updateOne({ name:following},{$push:{ "followers":`${name}`}})}
    })

    
  
    User.updateOne({ name:following},{$push:{ "followers":`${name}`}},
    (err,value)=>{
        // console.log(value)
        if(err){

            console.log(err)
            return
        }
    })
    

    User.updateOne(
        { name:name},{$push:{
            "following":`${following}`
        }},
        (err,value)=>{
            if(err){
                res.send(err)
            }
            if(value){
                res.send({message:`you followed ${following}`})

            }
            
        }
    )


})


//unfollow users 
app.delete("/users/:username",(req,res)=>{
    const name=req.params.username
    const unfollow=req.body.unfollow
  User.updateOne({name:name},
        {$pull:{"following":`${unfollow}`}},
       (err,value)=>{
    if(err){
        res.send(err)
        return
    }
 res.send({message:`you unfollowed ${unfollow}`})
    });

    User.updateOne({name:unfollow},
        {$pull:{"followers":`${name}`}},
       (err,value)=>{
    if(err){
        res.send(err)
        return
    }
//  res.send({message:`you unfollowed ${unfollow}`})
    });

})

app.get('/users/:username/followers', (req, res) => {
    const user = req.params.username;
    // do something with the user value
    User.findOne({name:user},(err,value)=>{
        if(!value){
            res.send({message:"user not present"})
        }
       res.send(value.followers) 
    })
    
  });

  app.get('/users/:username/following', (req, res) => {
    const user = req.params.username;
    // do something with the user value
    User.findOne({name:user},(err,value)=>{
        if(!value){
            res.send({message:"user not present"})
        }
       res.send(value.following) 
    })
    
  });
  


app.listen(8000,()=>{
    console.log("Server connsectes at 8000")
})
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User.js").user;
const List = require("../models/User.js").list;



router.get("/verify", (req,res) =>
{
  if(req.user !== undefined ) return res.redirect("/home");

  res.render("autho/autho");
})

router.post("/Register", (req,res) =>
{

   let {username,email,password} = req.body;

   //check if email already exists
   User.findOne({Email: email})
   .then(data =>
     {
       if(data) return res.render("autho/autho", { message:"Email is already taken", type: "warning"});

       User.findOne({UserName: username})
       .then(results =>
        {
           if(results)  return res.render("autho/autho", { message:"Username is already taken",type: "warning"});

           let newUser = new User(
             {
               UserName: username,
               Email : email,
               Password : password,
             })

          //create default lists for user
          let watching = new List(
            {
              ListName:"Watching",
            });

          let completed = new List(
            {
              ListName:"Completed"
            });
          let onHold = new List(
            {
              ListName: "On-Hold"
            });
          let dropped = new List(
            {
              ListName: "Dropped"
            });

          let lists = [watching,completed,onHold,dropped];

          lists.forEach((list) =>
          {
            list.save()
            .then(info =>
              {
                newUser.Lists.push(info.id);
              })
          })

           //hash password
           bcrypt.hash(newUser.Password,10,(err,hash) =>
           {
             if(err) throw err;

             newUser.Password = hash;

             //save user
             newUser.save((err,user) =>
             {
               console.log(user);
               if(err) throw err;

               res.render("autho/autho",{message : "You can now log in", type: "sucess"});
             });
           });


          })
      })

})


router.post("/login",(req,res,next) =>
{
   passport.authenticate("local",
   {
     successRedirect: "/home",
     failureRedirect: "/autho/verify",
   })(req,res,next);
})

router.get("/logout", (req,res) =>
{
  req.logout();
  res.redirect("/home");

})

module.exports = router;

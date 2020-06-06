const localStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const user = require("../models/User.js").user;



module.exports = (passport) =>
{
  //tell passport to use local Strategy
  passport.use(
    new localStrategy((username,password,done) =>
    {
      //check if user exists
      user.findOne({UserName: username})
      .then(data =>
        {
          //if nothing is found then user doesnt exist
          if(!data){ return done(null,false,{message : "email doesnt exist"});}


          //if email is found compare the password with password stored in db
          bcrypt.compare(password,data.Password, (err,isMatch) =>
          {
            if(err) throw err;
            //if it matches then user has sucessfully been authenticated
            if(isMatch)
            {
              //pass in data object that has all users data
              return done(null,data)
            }
            else
            {
              //if not a match then password is wrong
              return done(null,false, { message: "password wrong"});
            }
          });
        })
      .catch(err => console.log(err));



    })
  )

  //gets called when authentication is sucessfully done
  passport.serializeUser(function(user,done)
  {
    done(null,user.id);
  });

  //gets called when user logs out
  passport.deserializeUser(function(id,done)
  {
     user.findById(id, (err,user) =>
     {
       done(err,user);
     })
  })
}

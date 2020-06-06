const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const configPassport = require("./config/passport.js")(passport);
const checkAutho = require("./config/autho.js");
const mongoStore = require("connect-mongo")(session);
const fetch = require("node-fetch");
const list = require("./models/User.js").list;
const superSecretOBJ = require("./config/config.js");


const uri = superSecretOBJ.mongoURI;

//initlise express
let app = express();

let apiKey = superSecretOBJ.apiKey;

let port = process.env.PORT || 8080;

mongoose.set("useFindAndModify",false);

mongoose.connect(uri, {useNewUrlParser : true, useUnifiedTopology: true, useFindAndModify: false});

let db = mongoose.connection;

//notify us when we connect so we know that we are connected
db.once("open" , () =>
{
  console.log("connected to mongodb");

})

//configures session
app.use(session({
  secret: 'eeeeeeeeeeeeeeeeee',
  resave: true,
  saveUninitialized: true,
  store: new mongoStore({ mongooseConnection : db }),
}));

app.use(passport.initialize());
app.use(passport.session());

//set view engine to express
app.set("view engine","ejs");

//body parser decodes html form submitted data
app.use(express.urlencoded())
app.use(express.json());
//for static files like css and js that link to ejs
app.use(express.static("public"));

//set up routes
app.get("/",(req,res) => res.redirect(`/home`));
app.use("/user",checkAutho.ensureAutho,require("./routes/user.js"));
app.use("/autho", require("./routes/autho.js"));


app.get("/home", (req,res) =>
{
  let popularMovies = [ ];
  let popularShows = [ ];

  getDataForHome(popularMovies,popularShows)
  .then(() =>
 {

     res.render("home",{movies: popularMovies, shows: popularShows, user: req.user});

 })

})

async function getDataForHome(moviesarr,showarr)
{
    //in js and in an async function you can wait for functions that return promises to complete before moving on
    await getMoviesOrShows("popular",1,"movie",moviesarr);
    await getMoviesOrShows("popular",1,"tv",showarr);
}

app.get("/movies",(req,res) =>
{
  if(typeof req.query.type === "undefined" || typeof req.query.pageNum === "undefined") return res.redirect("/home");

  let filterType = req.query.type;
  let pageNum  = req.query.pageNum;
  let results = [ ];
  let maxPageCount = 0;

  getMoviesOrShows(filterType,pageNum,"movie",results)
  .then((maxCount) =>
  {
    maxPageCount = maxCount;

    res.render("movies",{ movies: results, maxPageCount: maxPageCount, currentPage: pageNum, filterType: filterType, user: req.user})
  })

})

app.get("/movieInfo",(req,res) =>
{
  //get movie info via movie id
  let id = req.query.id;

  getAllMovieOrShowInfo(id,"movie",req.user)
  .then(object =>
    {
      res.render("movieInfo",object);
    })
})

app.get("/shows",(req,res) =>
{
  if(typeof req.query.type === "undefined" || typeof req.query.pageNum === "undefined") return res.redirect("/home");

  let filterType = req.query.type;
  let pageNum  = req.query.pageNum;
  let results = [ ];
  let maxPageCount = 0;

  getMoviesOrShows(filterType,pageNum,"tv",results)
  .then((maxCount) =>
  {
    maxPageCount = maxCount;

    res.render("shows",{ shows: results, maxPageCount: maxPageCount, currentPage: pageNum, filterType: filterType,user: req.user})
  })
})

app.get("/showinfo",(req,res) =>
{
  //get show info via tv id
  let id = req.query.id;

  getAllMovieOrShowInfo(id,"tv",req.user)
  .then(object =>
    {
      res.render("showInfo",object);
    })
})

app.get("/Search",(req,res) =>
{
  if(req.query.q ===  undefined)
  {
    return  res.render("search",{user: req.user});
  }

  let query = req.query.q;
  let category = req.query.category;

  getSearch(category,query)
  .then((data) =>
  {
    if(category === "movie")
    {
      res.render("search",{user: req.user,movies: data,})
    }
    else
    {
      res.render("search",{user: req.user,shows: data ,})
    }
  })
})

app.get("/personInfo",async (req,res) =>
{
  let creditId = req.query.id;

  let credit = await getPersonCredit(creditId);
  let personInfo = await getPersonInfo(credit);

  res.render("person",{person: personInfo,user: req.user});

})

function getMoviesOrShows(type,pageNum,category,arrayToPopulate)
{
  return new Promise((resolve,reject) =>
  {
        fetch(`https://api.themoviedb.org/3/${category}/${type}?api_key=${apiKey}&language=en-UK&page=${pageNum}`)
        .then(res => res.json())
        .then(data =>
          {
            if(data.results.length === 0 || data === null) res();

            data.results.forEach((movie,index,array) =>
            {
              arrayToPopulate.push(movie);

               setTimeout(() =>
               {
                  if(index === array.length - 1) resolve(data.total_pages);
               },1000)
            })
          })
   })

}


async function getAllMovieOrShowInfo(id,category,user)
{
  let basicInfo = await getMovieOrShowInfo(id,category);
  let credits = await getMoviesOrShowCredits(id,category);
  let userLists = await getAllUserListsInfo(user);
  let recommendations = await getReconmendations(id,category);

  return {basic: basicInfo, credits: credits,userLists: userLists,user: user, recommendations: recommendations};

}

function getMovieOrShowInfo(id,category)
{

return new Promise((resolve,reject) =>
{

 fetch(`https://api.themoviedb.org/3/${category}/${id}?api_key=${apiKey}`)
 .then(res => res.json())
 .then(data =>
  {
    resolve(data);
  })
})

}

function getMoviesOrShowCredits(id,category)
{
  return new Promise((resolve,reject) =>
  {
     fetch(`https://api.themoviedb.org/3/${category}/${id}/credits?api_key=${apiKey}`)
     .then(res => res.json())
     .then(data =>
       {

         resolve(data);
       })
  })
}

function getAllUserListsInfo(user)
{
  return new Promise((resolve,reject) =>
  {
    if(user === null || typeof user === "undefined") resolve("undefined");

    let arr = [ ];

    user.Lists.forEach((lis,index,array) =>
    {
      list.findById(lis)
      .then(data =>
        {
          arr.push(data);

          setTimeout(() =>
          {
            if(index === array.length - 1) resolve(arr);
          },1000);
        })
    })

  })
}

function getReconmendations(id,category)
{
  return new Promise((resolve,reject) =>
  {
    fetch(`https://api.themoviedb.org/3/${category}/${id}/recommendations?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data =>
      {
        resolve(data);
      })
  })
}

function getSearch(category,query)
{
  return new Promise((resolve,reject) =>
  {
    fetch(`https://api.themoviedb.org/3/search/${category}?api_key=${apiKey}&query=${query}`)
    .then(res => res.json())
    .then(data =>
      {
        resolve(data.results);
      })
  })
}

function getPersonCredit(creditID)
{
  return new Promise((resolve,reject) =>
  {
    fetch(`https://api.themoviedb.org/3/credit/${creditID}?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data =>
      {
        resolve(data.person.id);
      })
  })

}

function getPersonInfo(personId)
{
  return new Promise((resolve,reject) =>
  {
    fetch(`https://api.themoviedb.org/3/person/${personId}?api_key=${apiKey}`)
    .then(res => res.json())
    .then(data =>
      {
        resolve(data);
      })
  })
}

app.listen(port);

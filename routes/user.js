const express = require("express");
const router = express.Router();
const user = require("../models/User.js").user;
const list = require("../models/User.js").list;
const fetch = require("node-fetch");
const superSecretOBJ = require("../config/config.js");

let apiKey = superSecretOBJ.apiKey;

router.get("/MyLists",(req,res) =>
{
   let lists = [ ];
   let promises = [ ];

   if(req.user.Lists.length === 0) res.render("user/MyLists");

   req.user.Lists.forEach((list,index,arr) =>
   {
    promises.push(getCompleteListData(lists,list)
     .then(() =>
     {

     }))
     ;
   })

   Promise.all(promises)
   .then(() =>
   {
      res.render("user/MyLists",{Lists: lists,user: req.user});
   })

})

router.get("/ListView",(req,res) =>
{
  let results = [ ];

  getCompleteListData(arrayToPopulate,req.query.id)
  .then(() =>
  {
    res.render("user/ListView",{List: results[0]});
  })
})

router.post("/addToList",(req,res) =>
{
   let category = req.body.category;
   let ListId = req.body.ListId;
   let id = req.body.id

   findListAndPerformOperation(ListId,category,addToList);

   function addToList(arr,data)
   {
     if(arr.length === 0)
     {
       arr.push(id);

       data.save()
       .then(() =>
       {
         return res.send("ok")
       })
     }

     arr.forEach((moiveId,index,array) =>
     {
       if(moiveId === id) return res.send("ok");

       setTimeout( () =>
       {
         if(index === array.length - 1)
       {
         arr.push(id);

         data.save()
         .then(() => res.send("ok"))
        }
      },2000)
     })
   }
})

router.post("/deleteFromList",(req,res) =>
{
  let category = req.body.category;
  let id = req.body.id;
  let otherId = req.body.index;

  findListAndPerformOperation(id,category,)

  function deleteFromList(arr,data)
  {
    console.log(arr.indexOf(otherId));

    // data.save()
    // .then(() =>  res.send("ok"));
  }
})

router.post("/createList",(req,res) =>
{
   let listName = req.body.name;

   createNewList(listName)
   .then((data) =>
   {
     req.user.Lists.push(data.id);

     req.user.save()
     .then(user => res.send("ok"));
   })

})

router.post("/deleteList",(req,res) =>
{
  list.findByIdAndDelete(req.body.id)
  .then(() =>
  {
    req.user.Lists.splice(req.user.Lists.indexOf(req.body.id),1)

    req.user.save()
    .then(user => res.send("ok"));
  });
})


function createNewList(listName)
{
  return new Promise((resolve,reject) =>
  {
    let newList = new list(
      {
        ListName: listName,
      })

      newList.save()
      .then(data => resolve(data));
  })
}

function findListAndPerformOperation(id,category,callback)
{
   findListById(id)
   .then((data) =>
   {
      switch (category) {
        case "movie":
          callback(data.Movies,data);
          break;
        case "tv":
          callback(data.TvShows,data);
          break;
      }
   })
}

async function getCompleteListData(arrayToPopulate,id)
{
   let data = await findListById(id);
   let allMovies = await getAllMoviesOrShows(data.Movies,"movies");
   let allShows = await getAllMoviesOrShows(data.TvShows,"tv");
   let totalMoiveWatchTime = await getTotalMovieWatchTime(allMovies);

   arrayToPopulate.push({ list: data, allMovies: allMovies, allShows: allShows,  totalMoiveWatchTime: totalMoiveWatchTime});

}


function findListById(id)
{
  return new Promise((resolve,reject) =>
  {
     list.findById(id)
     .then(data =>
       {
          resolve(data);
       })
  })
}

function getAllMoviesOrShows(mediaArr,category)
{
  return new Promise((resolve,reject) =>
  {
     let results = [ ];

     if(mediaArr.length === 0) resolve([]);

     mediaArr.forEach((id,index,arra) =>
     {
        getMovieOrShowInfo(id,"movie")
        .then((info) =>
        {
          results.push(info);

           setTimeout(() =>
           {
              if(index === arra.length - 1) resolve(results);
           },1000)

        })
     })
  })
}



function getTotalMovieWatchTime(moviesarr)
{
  return new Promise((resolve,reject) =>
  {
     if(moviesarr.length === 0) resolve(0);

     let total = 0;

     moviesarr.forEach((movie,index,arr) =>
     {
        total +=  movie.runtime;

        setTimeout(() =>
        {
          if(index === arr.length - 1) resolve(total);
        },1000)
     })
  })
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

module.exports = router;

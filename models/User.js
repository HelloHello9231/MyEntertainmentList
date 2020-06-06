const mongoose = require("mongoose");

let User = new mongoose.Schema(
  {
    UserName: String,
    Email: String,
    Password: String,
    Lists: [mongoose.Schema.Types.ObjectId],
    Friends: [mongoose.Schema.Types.ObjectId],
    FriendRequests: [mongoose.Schema.Types.ObjectId]
  });

let List = new mongoose.Schema(
  {
    ListName: String,
    TvShows:  [ ],
    Movies: [ ]
  });

let user = mongoose.model("Users",User);
let list = mongoose.model("Lists",List);

module.exports =
{
  user: user,
  list: list
}

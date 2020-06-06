module.exports =
{
  ensureAutho : function(req,res,next)
  {
    if(req.isAuthenticated())
    {
      return next();
    }

    res.redirect("/home");
  }
}

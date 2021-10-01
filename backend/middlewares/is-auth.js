const { json } = require("express");
const jwt= require("jsonwebtoken");
require('dotenv').config();

const publicPaths = ["/graphql/login", "/graphql/register"]

const checkPublicPath =(path)=>{
    return publicPaths.some(endpoint=>endpoint.indexOf(path)!==-1)
}

module.exports = (req,res,next)=>{
    if(checkPublicPath(req.originalUrl)){
        return next()
    }
    
    const authHeader = req.get('Authorization');
    if(!authHeader){
        req.isAuth = false;
        res.json({
            message:'Unauthenticated',
        })
    }
    const token = authHeader.split(' ')[1];
    if(!token || token === ''){
        req.isAuth = false;
        res.json({
            message:'Unauthenticated',
        })
    }
    let decodedToken;
    try{
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    }
    catch(err){
        req.isAuth = false;
        res.json({
            message:'Unauthenticated',
        })
    }
    if (!decodedToken){
        req.isAuth = false;
        res.json({
            message:'Unauthenticated',
        })
    }
    req.isAuth = true;
    req.email = decodedToken.email;
    req.userID = decodedToken.userID;
    //req.isAdmin = decodedToken.isAdmin;
    return next();
}
const { json } = require("express");
const jwt= require("jsonwebtoken");
const loginToken = require("../models/login-token");
require('dotenv').config();

const publicPaths = ["/graphql/login", "/graphql/register"]

const checkPublicPath =(path, token)=>{
    return publicPaths.some(endpoint=>endpoint === path) || token ==='Bearer login'
}

module.exports = (req,res,next)=>{
    const authHeader = req.get('Authorization') || req.get('authorization');

    if(checkPublicPath(req.originalUrl, authHeader)){
        return next()
    }

    if(!authHeader){
       
        req.isAuth = false;
        res.json({
            message:'Unauthenticated',
        })
        res.status(401);
        return res;
    }
    const token = authHeader.split(' ')[1];
    if(!token || token === ''){
        
        req.isAuth = false;
        res.json({
            message:'Unauthenticated',
        })
        res.status(401);
        return res ;
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
        res.status(401);
        return res;
    }
    if (!decodedToken){
        
        req.isAuth = false;
        res.json({
            message:'Unauthenticated',
        })
        res.status(401);
        return res;
    }
    req.isAuth = true;
    req.email = decodedToken.email;
    req.userID = decodedToken.userID;
    req.name = decodedToken.name;
    req.groupNames = decodedToken.groupNames;
    req.listNames = decodedToken.listNames;
    req.isAdmin = decodedToken.isAdmin;
    
    //req.isAdmin = decodedToken.isAdmin;
    return next();
}
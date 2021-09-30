const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Role = require('../helpers/role');

const userSchema = new Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    departments:[String],
    role:{
        type:String,
        default: Role.User
    }
})


module.exports = mongoose.model('User',userSchema);
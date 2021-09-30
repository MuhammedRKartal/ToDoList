const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const loginTokenSchema = new Schema({
    userID:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true,
    }
})

module.exports = mongoose.model('Token',loginTokenSchema);
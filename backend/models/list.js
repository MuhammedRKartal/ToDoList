const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const listType = require('../helpers/list-type')

const listSchema = new Schema({
    name:{
        type:String
    },
    type:{
        type:String,
        default: listType.Private
    },
    group:{
        type:String
        //default: listType.Private
    },
    listIndexes:[{type: Schema.Types.ObjectId, ref: 'ListIndex'}],
    users: [{
        type:String,
        required:true  
    }],
    admins: [{
        type:String,
        required:true  
    }]
    
}) 

module.exports = mongoose.model('List',listSchema)


const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const listType = require('../helpers/list-type')
const listIndex = require('../models/list-index')

const listSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    type:{
        type:String,
        default: listType.Private
    },
    listIndexes:[{type: Schema.Types.ObjectId, ref: 'ListIndex'}],
    users: [{
        uID:{
            type:Schema.Types.ObjectId, 
            ref: 'User', 
            required:true
        },
        authority:{
            type:String,
            required:true
        }
    }]
    
}) 

module.exports = mongoose.model('List',listSchema)


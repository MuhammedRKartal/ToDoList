//helpers
/*
const typeOfList = require('../helpers/list-type')
const role = require('../helpers/role');
const importancy = require('../helpers/importancy')
*/
const userAuthorityList = require('../helpers/list-user-authority')

//authentication
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//nodemailer
const nodemailer = require('nodemailer');

//graphql
const graphql = require('graphql');
const { buildResolveInfo } = require('graphql/execution/execute');
const {GraphQLObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLInt,
    GraphQLList, 
    GraphQLSchema,
    GraphQLNonNull,
    GraphQLBoolean
}= graphql;

const User = require('../models/user');
const List = require('../models/list')
const listIndex = require('../models/list-index');
const user = require('../models/user');




const userType = new GraphQLObjectType({
    name: 'user',
    fields:()=>({
        name:{type:GraphQLString},
        email:{type:GraphQLString},
        password:{type:GraphQLString}
    })
})

//populate
const listType = new GraphQLObjectType({
    name:'list',
    fields:()=>({
        name:{type:GraphQLString},
        type:{type:GraphQLString},
        listIndexes:{
            type: new GraphQLList(listIndexType),
            resolve(parent,args){
                return listIndex.find({listName:parent.name});//.populate().listName;
            }
        },
        users:{
            resolve(parent,args){
                const user = parent.users;
                /*Array.from(user).forEach(child=>{
                    return child.uID,child.authority
                })*/
                return User.find({$match:{id:parent.users.uID}});
            }
            
        }
    })
})

const listIndexType = new GraphQLObjectType({
    name:'listIndex',
    fields:()=>({
        description:{type:GraphQLString},
        importancy:{type:GraphQLString},
        isDone:{type:GraphQLBoolean},
        listName:{type:GraphQLString}
    })
})

const loginTokenType = new GraphQLObjectType({
    name:'Token',
    fields:()=>({
        userID:{type:GraphQLID},
        email:{type:GraphQLString},
        token:{type:GraphQLString}
    })
})



const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields:{
        login:{
            type: loginTokenType,
            args:{
                email:{type:GraphQLString},
                password:{type:GraphQLString}
            },
            resolve: async(parent,args)=>{
                const user = await User.findOne({email:args.email});
                if(!user){
                    throw new Error('User not Found');
                }
                else{
                    const isEqual = await bcrypt.compare(args.password, user.password); //hashing the password to store in database (security)
                    if(!isEqual){
                        throw new Error('Wrong password');
                    }
                    else{
                        //create a token to sign in it expires in 30 mins
                        const token = jwt.sign({email: user.email, userID: user.id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'2h'}); 
                        //return the user.id, email and the token
                        return {userID:user.id, email:user.email, token:token}; 
                    }
                }
            }
        },
        getLists:{
            type: new GraphQLList(listType),
            resolve:async (parent,args,req)=>{
                return await List.find({users:{$elemMatch:{uID:req.userID}}})
            }
        }
        
    }
})

const Mutation = new GraphQLObjectType({
    name: 'MutationType',
    fields:{
        register:{
            type:userType,
            args:{
                name:{type:new GraphQLNonNull(GraphQLString)},
                email:{type: new GraphQLNonNull(GraphQLString)},
                password:{type: new GraphQLNonNull(GraphQLString)}
            },
            resolve: async(parent,args)=>{
                const existingUser = await User.findOne({email: args.email});
                if (existingUser){
                    throw new Error('User already exists');
                }
                else{
                    const hashedPassword = await bcrypt.hash(args.password,16);
                    let user = new User({
                        name:args.name,
                        email:args.email,
                        password:hashedPassword
                    })
                    return await user.save();
                }
            }
        },
        updateUserInfo:{
            type:userType,
            args:{
                name:{type: GraphQLString},
                password:{type: GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                const user = User.find({email:req.email})
                if(args.name !== null){
                    user.updateOne({name:args.name})
                }
                if(args.password !== null){
                    const hashedPassword = await bcrypt.hash(args.password,16);
                    user.updateOne({password:hashedPassword})
                }
                return await user;
                
            }
        },
        createList:{
            type:listType,
            args:{
                name:{type: GraphQLString},
                type:{type: GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                const user = await User.findOne({email:req.email})

                const list = new List({
                    name:args.name,
                    type:args.type,
                    users:{
                        uID: user, 
                        authority: userAuthorityList.Admin
                    }
                })
                return list.save()
            }
        },
        addListIndex:{
            type:listIndexType,
            args:{
                description:{type:GraphQLString},
                importancy:{type:GraphQLString},
                listName:{type:GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                const listM = List.findOne({name:args.listName}); //Eğer ID yi bulamazsa mantıklı error dönmeli (yapılacak)

                if (args.description === null){
                    throw new Error("Enter a description")
                }
                else if(args.listName === null){
                    throw new Error("Enter a list name")
                }
                else if (args.description === null && args.listName === null){
                    throw new Error("Enter description and list name")
                }
                else{
                    let listE = null;
                    if(args.importancy === null){
                        listE = new listIndex({
                            description:args.description,
                            listName:args.listName
                        })
                    }
                    else{
                        listE = new listIndex({
                            description:args.description,
                            importancy:args.importancy,
                            listName:args.listName
                        })
                    }
                    await listM.updateOne({$addToSet:{listIndexes: listE}})
                    return listE.save()
                }
            }
        }
        
        
        
        /*,
        sendInviteEmail:{
            type: userType,
            args:{
                email:{type:new GraphQLList(GraphQLString)}
            },
            resolve: async(parent,args,req)=>{
                let info = await transporter.sendMail({
                    from: process.dotenv.MAIL_ADDRESS, // sender address
                    to: email, // list of receivers
                    subject: "Invitation ✔", // Subject line
                    text: (req.email," sends you an invitation to join a list"), // plain text body
                    html: "<b>Hello world?</b>", // html body
                });
            }
        }*/
        

    }
})

module.exports = new graphql.GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})

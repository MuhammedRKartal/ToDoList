//helpers

const TypeOfList = require('../helpers/list-type')
const Role = require('../helpers/role');
const Importancy = require('../helpers/importancy')

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
const Group = require('../models/group');





const userType = new GraphQLObjectType({
    name: 'user',
    fields:()=>({
        name:{type:GraphQLString},
        email:{type:GraphQLString},
        password:{type:GraphQLString},
        role:{type:GraphQLString},
        group:{
            type: new GraphQLList(groupType),
            resolve(parent,args){
                return Group.find({users:parent.email})
            }
        },
        lists:{
            type: new GraphQLList(listType),
            resolve(parent,args){
                return List.find({users:parent.email})
            }
        }
    })
})

const groupType = new GraphQLObjectType({
    name:'group',
    fields:()=>({
        name:{type:GraphQLString},
        leadMail:{type:GraphQLString},
        users:{
            type: new GraphQLList(userType),
            resolve(parent,args){
                return User.find({groupNames:parent.name});
            }
        }
    })
})

//populate
const listType = new GraphQLObjectType({
    name:'list',
    fields:()=>({
        name:{type:GraphQLString},
        type:{type:GraphQLString},
        group:{type:GraphQLString},
        listIndexes:{
            type: new GraphQLList(listIndexType),
            resolve(parent,args){
                console.log(parent.users);
                return listIndex.find({listID:parent._id});//.populate().listName;
            }
        },
        users:{
            type: new GraphQLList(userType),
            resolve(parent,args){
                return User.find({listNames:parent.name})
            }
        },
        admins:{
            type: new GraphQLList(userType),
            resolve(parent,args){
                const user = User.find({listNames:parent.name})
                return user.admins
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
        listID:{type:GraphQLString}
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
                        const token = jwt.sign({email: user.email, userID: user.id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'10h'}); 
                        //return the user.id, email and the token
                        return {userID:user.id, email:user.email, token:token}; 
                    }
                }
            }
        },
        getLists:{
            type: new GraphQLList(listType),
            resolve:async (parent,args,req)=>{
                //return await List.find({users:{$elemMatch:{userMail:req.email}}})
                return await List.find({users:req.email})
            }
        },
        
        getUsersOfList:{
            type: new GraphQLList(userType),
            args:{
                listId:{type:GraphQLString}
            },
            resolve:async(parent,args)=>{
                const list = await List.findById(args.listId);
                return await User.find({listNames:list.name});
            }
        },
        
        getAdminsOfList:{
            type: new GraphQLList(userType),
            args:{
                listId:{type:GraphQLString}
            },
            resolve:async(parent,args)=>{
                const list = await List.findById(args.listId);
                return await User.find({listNames:list.name}).admins;
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
                password:{type: new GraphQLNonNull(GraphQLString)},
                isAdmin:{type: GraphQLBoolean}
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
                        password:hashedPassword,
                        isAdmin:args.isAdmin
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
                type:{type: GraphQLString},
                group:{type: GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                console.log(req)
                const user = await User.findOne({email:req.email})
                /*if(user.isAdmin === true){

                }*/
                if(user!== null){
                    let list = null;
                    //const leadCheck = await Group.find({admins:req.email,name:args.group});
                    list = new List({
                        name:args.name,
                        type:args.type,
                        group:args.group,
                        users:req.email,
                        admins:req.email
                    })
                    await user.updateOne({$addToSet:{listNames:args.name}})
                    return await list.save()
                }
                else{
                    throw new Error("User not found");
                }
                
            }
        },
        addListIndex:{
            type:listIndexType,
            args:{
                description:{type:GraphQLString},
                importancy:{type:GraphQLString},
                listID:{type:GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                //const listM = List.findOneByID({_id:args.listID}); //Eğer ID yi bulamazsa mantıklı error dönmeli (yapılacak)
                const listM = List.findById(args.listID);
              
                let listE = new listIndex({
                    description:args.description,
                    importancy:args.importancy,
                    listID:args.listID
                })
                    
                await listM.updateOne({$addToSet:{listIndexes: listE}})
                return listE.save()
            }
        },
        createGroup:{
            type:groupType,
            args:{
                name:{type:GraphQLString}
            },
            resolve: async (parent,args,req)=>{
                if(req.isAdmin === false){
                    console.log('This is user')
                }
                const group = new Group({
                    name:args.name,
                    leadMail:req.email,
                    users:req.email
                })
                await User.findByIdAndUpdate(req.userID,{$addToSet:{groupNames:args.name}})
                return await group.save();
            }
        },
        removeUser:{
            type:userType,
            args:{
                email:{type:GraphQLString},
            },
            resolve: async(parent,args)=>{
                await User.findOneAndRemove({email:args.email});

                const list = List.find({users:args.email})
                await list.updateMany({$pull:{users:args.email}})

                const list1 = List.find({admins:args.email})
                await list1.updateMany({$pull:{admins:args.email}})

                const group = Group.find({users:args.email})
                await group.updateMany({$pull:{users:args.email}})

                const group1 = Group.find({leadMail:args.email})
                await group1.updateMany({leadMail:null})
            }
        },
        removeList:{
            type:userType,
            args:{
                listId:{type:GraphQLString}
            },
            resolve: async(parent,args)=>{
                const list = await List.findById(args.listId).name;
                console.log(list);
                const user = User.find({listNames:list})
                await user.updateMany({$pull:{listNames:list}})

                //const liindex = listIndex.find({listID:args.listId})
                //await liindex.remove({listID:args.listId})
                //await list.remove({_id:args.listId})
                

                
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

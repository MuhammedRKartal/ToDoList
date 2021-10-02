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

//get models
const User = require('../models/user');
const List = require('../models/list')
const listItem = require('../models/list-item');
const Group = require('../models/group');




//creating userType to return a user in queries or mutations
//this returns a type that includes
//name,email,password,role,all groups that user is attending, all lists that user is attending
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

//creating groupType,
//returns name, mail of leader, mail of all users
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
        listItems:{
            type: new GraphQLList(listItemType),
            resolve(parent,args){
                console.log(parent.users);
                return listItem.find({listID:parent._id});//.populate().listName;
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

const listItemType = new GraphQLObjectType({
    name:'listItem',
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
        token:{type:GraphQLString},
        name:{type:GraphQLString},
        groupNames:{type:new GraphQLList(GraphQLString)},
        listNames:{type:new GraphQLList(GraphQLString)},
        isAdmin:{type:GraphQLBoolean}
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
                        const token = jwt.sign({userID:user.id, email:user.email,name:user.name,groupNames:user.groupNames,listNames:user.listNames,isAdmin:user.isAdmin}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'10h'}); 
                        //return the user.id, email and the token
                        return {userID:user.id, email:user.email,name:user.name,groupNames:user.groupNames,listNames:user.listNames,isAdmin:user.isAdmin,token:token}; 
                    }
                }
            }
        },
        getLists:{
            type: new GraphQLList(listType),
            resolve:async (parent,args,req)=>{
                
                return await List.find({users:req.email}) 
                //return await List.find({users:{$elemMatch:{userMail:req.email}}})           
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
        },
        getListsOfGroup:{
            type: new GraphQLList(listType),
            args:{
                groupName:{type:GraphQLString}
            },
            resolve:async(parent,args)=>{
                return await List.find({name:args.groupName});
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
                //isAdmin:{type: GraphQLBoolean}
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
                        //isAdmin:args.isAdmin
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
                console.log(args.group)
                const user = await User.findOne({email:req.email})
                if(user!== null){
                    if(args.group !== undefined){
                        const leadCheck = await Group.find({leadMail:req.email,name:args.group})
                        if(leadCheck.length !== 0){
                            const list = new List({
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
                            throw new Error("Unauthorized");
                        }
                    }
                    else{
                        const list = new List({
                            name:args.name,
                            users:req.email,
                            admins:req.email
                        })
                        await user.updateOne({$addToSet:{listNames:args.name}})
                        return await list.save()
                    }
                }
                else{
                    throw new Error("User not found");
                }
                
            }
        },
        addListItem:{
            type:listItemType,
            args:{
                description:{type:GraphQLString},
                importancy:{type:GraphQLString},
                listID:{type:GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                const listM = List.findById(args.listID);
              
                let listE = new listItem({
                    description:args.description,
                    importancy:args.importancy,
                    listID:args.listID
                })
                    
                await listM.updateOne({$addToSet:{listItems: listE}})
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
                const list = await List.findById(args.listId).lean();
                
                const user = User.find({listNames:list.name})
                await user.updateMany({$pull:{listNames:list.name}})

                const liindex = listItem.find({listID:args.listId})
                await liindex.remove({listID:args.listId})

                await list.remove({_id:args.listId})
            }
        },
        addUserToList:{
            type:userType,
            args:{
                email:{type:new GraphQLNonNull(GraphQLString)},
                listId:{type:new GraphQLNonNull(GraphQLString)}
            },
            resolve: async(parent,args)=>{
                const user = User.findOne({email:args.email});
                const list = await List.findById(args.listId).lean();
                console.log(list.name);
                if(user !== null && list!==null) {
                    await user.updateOne({$addToSet:{listNames:list.name}})
                    await list.updateOne({$addToSet:{users:args.email}})
                }
                else{
                    return new Error("enter user and list name")
                }
            } 
        },
        addUserToGroup:{
            type:userType,
            args:{
                email:{type:new GraphQLNonNull(GraphQLString)},
                groupId:{type:new GraphQLNonNull(GraphQLString)}
            },
            resolve: async(parent,args)=>{
                const user = User.findOne({email:args.email});
                const group = await Group.findById(args.groupId).lean();
                if(user !== null && group!==null) {
                    await user.updateOne({$addToSet:{groupNames:group.name}})
                }
                else{
                    return new Error("enter valid user and group name")
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

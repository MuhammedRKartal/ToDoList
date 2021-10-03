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
//const directTransport = require('nodemailer-direct-transport');

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
const Log = require("../models/logs");


require('dotenv').config();
 
/*
var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: 'eapleasedontban@gmail.com',
      pass: 'alpgokcek',
    },
    tls:{
        rejectUnauthorized:false
    }
  });
*/

/*var transporter = nodemailer.createTransport(directTransport({
    name: 'smtp.gmail.com', 
    auth: {
        user: 'hirohitogame@gmail.com',
        pass: 'Mrk768437!',
      }
}));*/





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
        id:{type:GraphQLID},
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

//creates a list type
const listType = new GraphQLObjectType({
    name:'list',
    fields:()=>({
        id:{type:GraphQLID},
        name:{type:GraphQLString},
        type:{type:GraphQLString},
        group:{type:GraphQLString},
        description:{type:GraphQLString},
        //getting all items of list
        listItems:{
            type: new GraphQLList(listItemType),
            resolve(parent,args){
                
                return listItem.find({listID:parent._id});//.populate().listName;
            }
        },
        //getting users of list
        users:{
            type: new GraphQLList(userType),
            resolve(parent,args){
                return User.find({listNames:parent.name})
            }
        },
        //getting admins of list
        admins:{
            type: new GraphQLList(userType),
            resolve: async(parent,args)=>{
                const list = await List.findById(parent.id)
                console.log(list.admins);
                const users = await User.find({email:list.admins})
                return users
            }
        }
    })
})

//listItem
const listItemType = new GraphQLObjectType({
    name:'listItem',
    fields:()=>({
        id:{type:GraphQLID},
        description:{type:GraphQLString},
        importancy:{type:GraphQLString},
        isDone:{type:GraphQLBoolean},
        listID:{type:GraphQLString}
    })
})

//logintoken
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

//logtype
const logType = new GraphQLObjectType({
    name:"Log",
    field:()=>({
        email:{type:GraphQLString},
        operation:{type:GraphQLString},
        time:{type:Date}
    })
})


//queries
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields:{
        //login query returns a loginToken
        login:{
            type: loginTokenType,
            //takes email and password
            args:{
                email:{type:GraphQLString},
                password:{type:GraphQLString}
            },
            resolve: async(parent,args)=>{
                const user = await User.findOne({email:args.email});
                //if there isn't any user with given email return error
                if(!user){
                    return new Error('User not Found');
                }
                else{
                    const isEqual = await bcrypt.compare(args.password, user.password); //hashing the password to store in database (security)
                    if(!isEqual){
                        //logging the operation
                        let logT = new Log({
                            email: args.email,
                            operation: "Entered Wrong Password",
                            time:Date.now()
                        })
                        logT.save()

                        throw new Error('Wrong password');
                        
                    }
                    else{
                        //create a token to sign in it expires in 10 hours(10 hours is for development)
                        const token = jwt.sign({userID:user.id, email:user.email,name:user.name,groupNames:user.groupNames,listNames:user.listNames,isAdmin:user.isAdmin}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'10h'}); 
                        
                        //log
                        let logT = new Log({
                            email: user.email,
                            operation: "login",
                            time:Date.now()
                        })
                        logT.save()

                        //return necessary things
                        return {userID:user.id, email:user.email,name:user.name,groupNames:user.groupNames,listNames:user.listNames,isAdmin:user.isAdmin,token:token}; 
                    }
                }
            }
        },

        //get all the lists of current user
        getLists:{
            type: new GraphQLList(listType),
            resolve:async (parent,args,req)=>{
                return await List.find({users:req.email})//,type:TypeOfList.Private}) 
                       
            }
        },

        //get all the groups that current user is attending
        getGroups:{
            type: new GraphQLList(groupType),
            resolve:async(parent,args,req)=>{
                return await Group.find({users:req.email})
            }
        },
        //get list by given id
        getList:{
            type: listType,
            args:{
                listId:{type:GraphQLString}
            },
            resolve: async(parent,args)=>{
                const list = await List.findById(args.listId).populate("listItems")
                return list;
            }
        },
        //get lists of given group
        getListsOfGroup:{
            type: new GraphQLList(listType),
            args:{
                groupName:{type:GraphQLString}
            },
            resolve:async(parent,args,req)=>{
                let logT = new Log({
                    email: req.email,
                    operation: `Get lists of group: ${groupName}`,
                    time:Date.now()
                })
                logT.save()
                return await List.find({name:args.groupName});
            }
        }
    }
})

//mutations for database post
const Mutation = new GraphQLObjectType({
    name: 'MutationType',
    fields:{
        //register by name email and password
        register:{
            type:userType,
            args:{
                name:{type:new GraphQLNonNull(GraphQLString)},
                email:{type: new GraphQLNonNull(GraphQLString)},
                password:{type: new GraphQLNonNull(GraphQLString)},
            },
            resolve: async(parent,args,req)=>{
                const existingUser = await User.findOne({email: args.email});
                if (existingUser){
                    let logT = new Log({
                        email: args.email,
                        operation: `Fail, creating existing user`,
                        time:Date.now()
                    })
                    logT.save()
                    throw new Error('User already exists');
                    
                }
                else{
                    let logT = new Log({
                        email: args.email,
                        operation: `User created`,
                        time:Date.now()
                    })
                    logT.save()

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
                let logT = new Log({
                    email: args.email,
                    operation: `User info updated`,
                    time:Date.now()
                })
                logT.save()
                return await user;
                
            }
        },
        createList:{
            type:listType,
            args:{
                name:{type: GraphQLString},
                type:{type: GraphQLString},
                group:{type: GraphQLString},
                description:{type:GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                
                const user = await User.findOne({email:req.email})
                if(user!== null){
                    if(args.group){
                        const leadCheck = await Group.find({leadMail:req.email,name:args.group})
                        if(leadCheck.length !== 0){
                            let logT = new Log({
                                email: req.email,
                                operation: `Created a list in ${args.group}`,
                                time:Date.now()
                            })
                            logT.save()
                            
                            const group = await Group.findOne({name:args.group})
                            const list = new List({
                                name:args.name,
                                type:args.type,
                                group:args.group,
                                description:args.description,
                                users:group.users,
                                admins:req.email
                            })

                            await User.updateMany({email:group.users},{$addToSet:{listNames:args.name}})
                            return await list.save()
                        }
                        else{
                            let logT = new Log({
                                email: req.email,
                                operation: `Fail, unauthorized to create a list in ${args.group}`,
                                time:Date.now()
                            })
                            logT.save()
                            throw new Error("Unauthorized");
                        }
                    }
                    else{
                        let logT = new Log({
                            email: req.email,
                            operation: `Created private list`,
                            time:Date.now()
                        })
                        logT.save()
                        const list = new List({
                            name:args.name,
                            users:req.email,
                            admins:req.email,
                            description:args.description
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
                const listM = await List.findById(args.listID);
                
                
                if(listM.type === "GROUP"){
                    let adminCheck = await Group.find({leadMail:req.email,name:listM.group})
                    
                    if(adminCheck.length!==0){
                        let listE = new listItem({
                            description:args.description,
                            importancy:args.importancy,
                            listID:args.listID
                        })
                            
                        await listM.updateOne({$addToSet:{listItems:listE}})
                        listE.save()
        
                        let logT = new Log({
                            email: req.email,
                            operation: `Added list item to ${listM.name}`,
                            time:Date.now()
                        })
                        logT.save()
        
                        return await listE
                    }
                    else{
                        throw new Error("Unauthorized")
                    }
                    
                }
                else{
                    let listE = new listItem({
                        description:args.description,
                        importancy:args.importancy,
                        listID:args.listID
                    })
                        
                    await listM.updateOne({$addToSet:{listItems: listE}})
                    listE.save()
    
                    let logT = new Log({
                        email: req.email,
                        operation: `Added list item to ${listM.name}`,
                        time:Date.now()
                    })
                    logT.save()
    
                    return await listE
                }
                

                
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
                await group.save();

                let logT = new Log({
                    email: req.email,
                    operation: `Created group: ${args.name}`,
                    time:Date.now()
                })
                logT.save()

                return await group
            }
        },
        removeUser:{
            type:userType,
            args:{
                email:{type:GraphQLString},
            },
            resolve: async(parent,args)=>{
                
                const list = List.find({users:args.email})
                await list.updateMany({$pull:{users:args.email}})

                const list1 = List.find({admins:args.email})
                await list1.updateMany({$pull:{admins:args.email}})

                const group = Group.find({users:args.email})
                await group.updateMany({$pull:{users:args.email}})

                const group1 = Group.find({leadMail:args.email})
                await group1.updateMany({leadMail:null})

                return await User.findOneAndRemove({email:args.email});
            }
        },
        removeList:{
            type:userType,
            args:{
                listId:{type:GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                const list = await List.findById(args.listId);
                if(list){
                    if(list.type === "GROUP"){
                        const group = await Group.findOne({name:list.group})
                        
                        if(group.leadMail !== req.email){
                            return new Error("Unauthorized, you must be lead of the group to delete this.")
                        }
                        else{
                            await User.updateMany({listNames:list.name},{$pull:{listNames:list.name}})
    
                            const liindex = listItem.find({listID:args.listId})
                            await liindex.deleteOne({listID:args.listId})
    
                            await list.deleteOne({id:args.listId})
                            let logT = new Log({
                                email: req.email,
                                operation: `Removed the list:  ${list.name}`,
                                time:Date.now()
                            })
                            logT.save()
                            return await list
                        }
                    }
                    else{
                        await User.updateMany({listNames:list.name},{$pull:{listNames:list.name}})
    
                        const liindex = listItem.find({listID:args.listId})
                        await liindex.deleteOne({listID:args.listId})
    
                        await list.deleteOne({id:args.listId})
    
                        let logT = new Log({
                            email: req.email,
                            operation: `Removed the list:  ${list.name}`,
                            time:Date.now()
                        })
                        logT.save()
                        return await list
                    }
                }
                else{
                    return new Error("There is no list with that name!")
                }   
            }
        },
        removeListItem:{
            type:listItemType,
            args:{
                itemId:{type:GraphQLString}
            },
            resolve: async(parent,args,req)=>{
                const adminCheck = await List.find({admins:req.email,listItems:args.itemId})
                if(adminCheck.length !== 0){
                    const list = List.find({listItems:args.itemId});
                    await list.updateOne({$pull:{listItems:args.itemId}})
                    
                    let logT = new Log({
                        email: req.email,
                        operation: `${req.email}, removed the list item ${args.itemId}`,
                        time:Date.now()
                    })
                    logT.save()

                    return await listItem.findByIdAndDelete(args.itemId)
                }
                else{
                    throw new Error("Unauthorized")
                }
            }
        },


        //adding user to a given list
        //if user already in list throw error
        //if the current user is not admin give unauthorized error
        //if email or list Id is invalid return error
        //updates users
        addUserToList:{
            type:userType,
            args:{
                email:{type:new GraphQLNonNull(GraphQLString)},
                listId:{type:new GraphQLNonNull(GraphQLString)}
            },
            resolve: async(parent,args,req)=>{
                /*
                let mailOptions = {
                    from:"hirohitogame@gmail.com",
                    to:args.email,
                    subject:'List invitation',
                    text: `${req.email}, added you to a To'Doly list.`
                }
                */

                let user = await User.findOne({email:args.email});
                let list = await List.findById(args.listId);

                /*
                if(!user){
                    const pw = "asd";
                    const nUser = new User({
                        email:args.email,
                        password:pw,
                        name:args.email
                    })
                    mailOptions = {
                        from:"eapleasedontban@gmail.com",
                        to:args.email,
                        subject:'List invitation',
                        html: `<p>Welcome, <b>${req.email}</b>, added you to a To'Doly list. 
                        <br/> You can complete your registration by clicking the link below. 
                        <br/> if you don't want to register you can delete your account by clicking delete my account button.</p>
                        <br/><br/> <a>Complete your registeration</a> <br/><a>Delete your account</a>`
                    }
                    console.log(transporter);
                    //nUser.save()
                    await transporter.sendMail(mailOptions).then(res=>{
                        console.log("email sent")
                        return;
                    }).catch(err=>{
                        console.error(err)
                        return;
                    })
                }
                */
                
                //console.log(list);
                if(user && list) {
                    //console.log(mailOptions);      
                    
                    const adminCheck = await List.find({admins:req.email,_id:args.listId});
                    if(adminCheck.length !== 0){ 
                        const isInList = await List.find({users:user.email, _id:args.listId})

                        if(isInList.length !==0){
                            return new Error("User is already in the list")
                        }

                        await user.updateOne({$addToSet:{listNames:list.name}})
                        await list.updateOne({$addToSet:{users:args.email}})

                        let logT = new Log({
                            email: req.email,
                            operation: `Added user ${user.name} to list ${list.name} `,
                            time:Date.now()
                        })
                        logT.save()
                        return await user
                    }
                    else{
                        let logT = new Log({
                            email: req.email,
                            operation: `Unauthorized to add user`,
                            time:Date.now()
                        })
                        logT.save()
                        return new Error("Unauthorized")
                    }
                }
                else{
                    return new Error("enter valid user and list name ")
                }
                
            } 
        },


        //adding user to a group
        //updating the users of group
        //updating groups of user
        addUserToGroup:{
            type:userType,
            args:{
                email:{type:new GraphQLNonNull(GraphQLString)},
                groupId:{type:new GraphQLNonNull(GraphQLString)}
            },
            resolve: async(parent,args,req)=>{
                const user = await User.findOne({email:args.email});
                const group = await Group.findById(args.groupId);
                
                const isInGroup = await Group.find({users:user.email,name:group.name})
                
                if(isInGroup.length !==0){
                    return new Error("User is already in the group")
                }

                if(!user){
                    return new Error("Enter a valid e-mail")
                }
                else if(!group){
                    return new Error("Enter a valid group")
                }
                else if(!group && !user){
                    return new Error("Enter a valid group and e-mail")
                }
                else{
                    const adminCheck = await Group.find({leadMail:req.email,name:group.name})

                    if(adminCheck.length !== 0){
                        await user.updateOne({$addToSet:{groupNames:group.name}})
                        await group.updateOne({$addToSet:{users:args.email}})
                        const list = await List.find({group:group.name})

                        const names = list.map(item=>item.name)
                        await user.updateOne({$addToSet:{listNames:{$each:names}}})
                        await List.updateMany({group:group.name},{$addToSet:{users:args.email}})
                        
                        let logT = new Log({
                            email: user.email,
                            operation: `${req.email}, added ${args.email} to group ${group.name}`,
                            time:Date.now()
                        })
                        logT.save()

                        return user
                    }
                    else{
                        return new Error("Unauthorized");
                    }  
                }
            } 
        },
        //change the value of isDone like true or false
        changeListItemDone:{
            type:listItemType,
            args:{
                itemId:{type:GraphQLString},
                value: {type:GraphQLBoolean}
            },
            resolve: async(parent,args,req)=>{
                const adminCheck = await List.find({admins:req.email,listItems:args.itemId})
                if(adminCheck.length !== 0){
                    return await listItem.findByIdAndUpdate(args.itemId,{isDone:args.value})
                }
                else{
                    throw new Error("Unauthorized")
                }
            }
        },
        
        
        
     

    }
})

module.exports = new graphql.GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})

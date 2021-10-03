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
const Log = require("../models/logs");

const directTransport = require('nodemailer-direct-transport');
 

/*let transporter = nodemailer.createTransport({
    port: 465,
    secure: false,
    secureConnection: false,
    service:"Gmail",
    auth: {
      user: process.env.MAIL_ADDRESS,
      pass: process.env.MAIL_PASSWORD,
    },
    tls:{
        rejectUnauthorized:false
    }
  });*/

  var transporter = nodemailer.createTransport(directTransport({
    name: 'smtp.gmail.com', // should be the hostname machine IP address resolves to
    from: process.env.MAIL_ADDRESS,
    auth: {
        user: process.env.MAIL_ADDRESS,
        pass: process.env.MAIL_PASSWORD,
      }
}));





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
        id:{type:GraphQLString},
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
        id:{type:GraphQLID},
        name:{type:GraphQLString},
        type:{type:GraphQLString},
        group:{type:GraphQLString},
        description:{type:GraphQLString},
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

const logType = new GraphQLObjectType({
    name:"Log",
    field:()=>({
        email:{type:GraphQLString},
        operation:{type:GraphQLString},
        time:{type:Date}
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
                        let logT = new Log({
                            email: args.email,
                            operation: "Entered Wrong Password",
                            time:Date.now()
                        })
                        logT.save()
                        throw new Error('Wrong password');
                        
                    }
                    else{
                        //create a token to sign in it expires in 30 mins
                        const token = jwt.sign({userID:user.id, email:user.email,name:user.name,groupNames:user.groupNames,listNames:user.listNames,isAdmin:user.isAdmin}, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'10h'}); 
                        //return the user.id, email and the token
                        let logT = new Log({
                            email: user.email,
                            operation: "login",
                            time:Date.now()
                        })
                        logT.save()

                        return {userID:user.id, email:user.email,name:user.name,groupNames:user.groupNames,listNames:user.listNames,isAdmin:user.isAdmin,token:token}; 
                    }
                }
            }
        },
        getLists:{
            type: new GraphQLList(listType),
            resolve:async (parent,args,req)=>{
                return await List.find({users:req.email})//,type:TypeOfList.Private}) 
                //return await List.find({users:{$elemMatch:{userMail:req.email}}})           
            }
        },
        getGroups:{
            type: new GraphQLList(groupType),
            resolve:async(parent,args,req)=>{
                return await Group.find({users:req.email})
            }
        },
        
        /*getUsersOfList:{
            type: new GraphQLList(userType),
            args:{
                listId:{type:GraphQLString}
            },
            resolve:async(parent,args)=>{
                const list = await List.findById(args.listId);
                return await User.find({listNames:list.name});
            }
        },*/
        
        /*getAdminsOfList:{
            type: new GraphQLList(userType),
            args:{
                listId:{type:GraphQLString}
            },
            resolve:async(parent,args)=>{
                const list = await List.findById(args.listId);
                return await User.find({listNames:list.name}).admins;
            }
        },*/

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
                console.log(args.group)
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
                            const list = new List({
                                name:args.name,
                                type:args.type,
                                group:args.group,
                                description:args.description,
                                users:req.email,
                                admins:req.email
                            })
                            await user.updateOne({$addToSet:{listNames:args.name}})
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
                
                console.log(listM.type);
                if(listM.type === "GROUP"){
                    let adminCheck = await Group.find({leadMail:req.email,name:listM.group})
                    console.log(adminCheck)
                    if(adminCheck.length!==0){
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
        /*deleteGroup:{

        },*/
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
                
                const user = User.find({listNames:list.name})
                await user.updateMany({$pull:{listNames:list.name}})

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
        },
        addUserToList:{
            type:userType,
            args:{
                email:{type:new GraphQLNonNull(GraphQLString)},
                listId:{type:new GraphQLNonNull(GraphQLString)}
            },
            resolve: async(parent,args,req)=>{

                let mailOptions = {
                    from:"hirohitogame@gmail.com",
                    to:args.email,
                    subject:'List invitation',
                    text: `${req.email}, added you to a To'Doly list.`
                }
                

                let user = await User.findOne({email:args.email});
                let list = await List.findById(args.listId);

                //console.log(user);

                if(!user){
                    const pw = "asd";
                    const nUser = new User({
                        email:args.email,
                        password:pw,
                        name:args.email
                    })
                    mailOptions = {
                        from:"hirohitogame@gmail.com",
                        to:args.email,
                        subject:'List invitation',
                        html: `<p>Welcome, <b>${req.email}</b>, added you to a To'Doly list. 
                        <br/> You can complete your registration by clicking the link below. 
                        <br/> if you don't want to register you can delete your account by clicking delete my account button.</p>
                        <br/><br/> <a>Complete your registeration</a> <br/><a>Delete your account</a>`
                    }
                    nUser.save()
                }
                
                //console.log(list);
                if(list) {
                    console.log(mailOptions);
                    user = await User.findOne({email:args.email});
                    await transporter.sendMail(mailOptions).then(res=>{
                        console.log("email sent")
                        return;
                    }).catch(err=>{
                        console.error("a")
                        return;
                    })

                    const adminCheck = await List.find({admins:req.email,_id:args.listId});
                    if(adminCheck.length !== 0){
                        
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
                        throw new Error("Unauthorized")
                    }
                }
                else{
                    throw new Error("enter user and list name")
                }
                
            } 
        },
        addUserToGroup:{
            type:userType,
            args:{
                email:{type:new GraphQLNonNull(GraphQLString)},
                groupId:{type:new GraphQLNonNull(GraphQLString)}
            },
            resolve: async(parent,args,req)=>{
                const user = await User.findOne({email:args.email});
                const group = await Group.findById(args.groupId);
                if(!user){
                    throw new Error("Enter a valid e-mail")
                }
                else if(!group){
                    throw new Error("Enter a valid group")
                }
                else if(!group && !user){
                    throw new Error("Enter a valid group and e-mail")
                }
                else{
                    const adminCheck = await Group.find({leadMail:req.email,name:group.name})

                    if(adminCheck.length !== 0){
                        await user.updateOne({$addToSet:{groupNames:group.name}})
                        await group.updateOne({$addToSet:{users:args.email}})
                        const list = await List.find({group:group.name})
                        
                        const names = list.map(item=>item.name)
                        user.updateOne({$push:{listNames:{$each:names}}})
                    
                        return user
                    }
                    else{
                        return new Error("Unauthorized");
                    }  
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

import {gql} from 'apollo-boost';


//Queries

const loginQuery=gql`
    query($email:String!,$password:String!){
        login(email:$email,password:$password){
            token
        }
    }
`

const getListsQuery=gql`
    query{
        getLists{
            name
            type
            listIndexes{
                description
            }
            users{
                name
            } 
        }
    }
`











//Mutations
const registerMutation=gql`
    mutation($name:String!,$email:String!,$password:String!){
        register(name:$name, email:$email, password:$password){
            name
            email
        }
    }
`

const updateUserInfoMutation=gql`
    mutation($name:String,$email:String){
        updateUserInfo(name:$name, email:$email){
            name
            email
        }
    }
`

const createListMutation=gql`
    mutation($name:String!,$type:String){
        createList(name:$name, type:$type){
            name
            type
        }
    }
`
const addListIndexMutation=gql`
    mutation($description:String!,$importancy:String,$listID:String!){
        addListIndex(description:$description, importancy:$importancy, listID:$listID){
            description
            importancy
            listID
            isDone
        }
    }
`

export {addListIndexMutation,registerMutation,createListMutation,updateUserInfoMutation,loginQuery,getListsQuery};
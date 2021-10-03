import { gql } from '@apollo/client';

//Mutations
export const registerMutation=gql`
    mutation($name:String!,$email:String!,$password:String!){
        register(name:$name, email:$email, password:$password){
            name
            password
            email
        }
    }
`

export const updateUserInfoMutation=gql`
    mutation($name:String,$password:String){
        updateUserInfo(name:$name, password:$password){
            name
            password
        }
    }
`

export const createListMutation=gql`
    mutation($name:String!,$description:String!,$type:String,$group:String){
        createList(name:$name, description:$description,type:$type, group:$group){
            name
            description
            type
            group
        }
    }
`

export const createGroupMutation=gql`
    mutation($name:String!){
        createGroup(name:$name){
            name
        }
    }
`

export const addListItemMutation=gql`
    mutation($description:String!,$importancy:String,$listID:String!){
        addListItem(description:$description, importancy:$importancy, listID:$listID){
            description
            importancy
            listID
            isDone
        }
    }
`

export const removeUserMutation=gql`
mutation($email:String!){
    removeUser(email:$email){
        email
    }
}
`

export const removeListMutation=gql`
    mutation($listId:String!){
        removeList(listId:$listId){
            name
        }
    }
`

export const addUserToListMutation=gql`
    mutation($email:String!,$listId:String!){
        addUserToList(email:$email,listId:$listId){
            name
        }
    }
`

export const addUserToGroupMutation=gql`
    mutation($email:String!,$groupId:String!){
        addUserToGroup(email:$email,groupId:$groupId){
            name
        }
    }
`
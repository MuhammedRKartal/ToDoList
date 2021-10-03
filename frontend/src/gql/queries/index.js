import { gql } from '@apollo/client';

export const LOGIN_QUERY = gql`
query($email:String!,$password:String!){
    login(email:$email,password:$password){
        userID
        email
        token
        name
    }
}
`

export const GET_LISTS_QUERY=gql`
query{
    getLists{
        id
        name
        type
        description
        group
        listItems{
            description
        }
        users{
            name
        } 
    }
}
`

/*
export const getUsersOfListQuery=gql`
query($listId:String!){
    getUsersOfList(listId:$listId){
        name
        email
    }
}
`

/*
export const getAdminsOfListQuery=gql`
query($listId:String!){
    getAdminsOfList(listId:$listId){
        name
        email
    }
}
`
*/

export const GET_LISTS_OF_GROUPS = gql`
query($groupName:String!){
    getListsOfGroup(groupName:$groupName){
        name
        email
    }
}
`

export const GET_GROUPS_QUERY = gql`
    query{
        getGroups{
            id
            name
            leadMail
            users{
                name
            }
        }
    }
`
import React,{Component} from 'react';
import {graphql} from 'react-apollo';
import {flowRight as compose} from 'lodash';

import {getListsQuery} from '../queries/queries'

class GetLists extends Component{

    showLists(){
        console.log(this.props);
        const loading = this.props.data.loading;
        if(loading == false){
            const list = this.props.data.list;
            if(list){
                return(
                    <div>
                        <h2>{list.name}</h2>
                    </div>
                )
            }
        }
    }

    render(){
        return(
            <div>
                <p>{this.showLists()}</p>
            </div>
        )
    }
}



export default graphql(getListsQuery,{
    options:(props)=>{
        return{
            variables:{
                name:props.name
            }
        }
    }
}) (GetLists);
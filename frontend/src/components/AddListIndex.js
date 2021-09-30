import React,{Component} from 'react';
import {graphql} from 'react-apollo';
import {flowRight as compose} from 'lodash';

import {addListIndexMutation} from '../queries/queries'


class AddListIndex extends Component{

    constructor(props){
        super(props)
        this.state={
            description:'',
            importancy:'Normal',
            listID:''
        }
    }

    sendForm(e){
        e.preventDefault();
        this.props.addListIndexMutation({
            variables:{
                description:this.state.description,
                importancy:this.state.importancy,
                listID:this.state.listID
            }
        })
    }

    render(){
        return(
            <form className="add-list-index" onSubmit={this.sendForm.bind(this)}>
                <div>
                    <label>Description:</label>
                    <input type='text' onChange={(e)=>this.setState({description:e.target.value})}></input>
                </div>
                <div>
                    <label>Importance</label>
                    <input list='Importancy' onChange={(e)=>this.setState({importancy:e.target.value})}/>
                    <datalist id='Importancy'>
                        <option value="High"/>
                        <option value="Normal"/>
                        <option value="Low"/>
                    </datalist>
                </div>
                <div>
                    <label>List Id:</label>
                    <input type='text' onChange={(e)=>this.setState({listID:e.target.value})}></input>
                </div>
                <button>Add List Index</button>
            </form>
        )
    }
}

export default compose(
    graphql(addListIndexMutation,{name:"addListIndexMutation"})
)(AddListIndex);
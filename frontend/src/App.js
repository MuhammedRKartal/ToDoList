import React, {Component} from 'react';
import ApolloClient from 'apollo-boost';
import {ApolloProvider} from 'react-apollo'; //clienti belirleyebilmek kodların uri adresini çağırmasını sağlamak

import AddListIndex from './components/AddListIndex';
import GetLists  from './components/GetLists';

//apolloproviderin kullanacağı client
const client = new ApolloClient({
  uri:'http://localhost:3000/graphql'
})

class App extends Component {
  render(){
    return (
      <ApolloProvider client={client}>
        <div id="main">
          <h1>Just Try</h1>
          <GetLists/>
          <AddListIndex/>
        </div>
      </ApolloProvider>
    );
  } 
}

export default App;

import {API_URL} from '../app-consts';
import ApolloClient from 'apollo-boost';

export const GraphQLClient = () => {
  const getToken = () => `Bearer ${localStorage.getItem('token')}`;
  const headers = {
    headers: {
      authorization: getToken(),
    }
  };
  return new ApolloClient({ 
    uri: `${API_URL}`,
    request: (operation) => {
      operation.setContext({
        ...headers
      });
    },
  });
};
import React, { useContext } from 'react'
import { Route, Redirect } from 'react-router-dom';
import { UserContext } from '../../contexts';

const RestrictedRoute = props => {
    const { user } = useContext(UserContext);

    const canAccessThePage = () => {
        return user?.isAuthenticated
    }
    
    return (
        <>
            {canAccessThePage() ? <Route {...props}/> : <Redirect to={ '/sign-in' } />}
        </>
    )
}

export default RestrictedRoute;
import React, { useState } from 'react';
import { withRouter, Switch, Route, Redirect } from 'react-router-dom';

import Base from '../components/Layout/Base';
import AuthBase from '../components/Layout/AuthBase';
import RestrictedRoute from './RestrictedRoute';

import Lists from '../pages/Lists';
import Login from '../pages/Login';
import ResetPassword from '../pages/ResetPassword';
import NotFound from '../pages/NotFound';
import Home from '../pages/Home';
import Groups from '../pages/Groups';
import { UserContext } from '../contexts';

const listofPages = [
    '/sign-in',
    '/reset-password',
    '/404'
];

const Routes = ({ location }) => {
    const [user, setUser] = useState();
    const value = { user: {isAuthenticated:!!localStorage.getItem('user'), user: JSON.parse(localStorage.getItem('user'))}, setUser };

    if(listofPages.indexOf(location.pathname) > -1) {
        return (
            <UserContext.Provider value={ value }>
                <AuthBase>
                    <Switch location={location}>
                        <Route exact path="/sign-in" component={Login}/>
                        <Route exact path="/reset-password" component={ResetPassword}/>
                        <Route exact path="/404" component={NotFound}/>
                    </Switch>
                </AuthBase>
            </UserContext.Provider>
        )
    }
    else {
        return (
            <UserContext.Provider value={ value }>
                <Base>
                    <Switch location={location}>
                        <RestrictedRoute exact path="/" component={Home} />
                            
                        <RestrictedRoute exact path="/lists" component={Lists}/>
                        <RestrictedRoute exact path="/groups" component={Groups}/>
                            
                        <Redirect to={"/"}/>
                    </Switch>
                </Base>
            </UserContext.Provider>
        )
    }
}

export default withRouter(Routes);
import React, { useContext, useEffect} from 'react'
import {useHistory} from 'react-router-dom'
import Header from '../../Header'
import Footer from '../../Footer'
import { UserContext } from '../../../contexts';

import './auth-base.scss';

const AuthBase = props => {
    const { user, setUser } = useContext(UserContext);
    const history = useHistory();

    //if user object changes do the things below
    useEffect(() => {
        //if user exists push home page to the history
        if(user?.user){
            history.push('/')
            window.location.reload(); //reload the current window
        }
    }, [user])

    //header
    //props.children is to create flexible components
    //footer
    return (
    <div className="wrapper">
        <Header isAuthPage={true}/> 
        <section className="auth-base">
            { props.children }
        </section>
        <Footer />
    </div>);
}

export default AuthBase;
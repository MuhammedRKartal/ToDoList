import React, {useState, useContext, useEffect} from 'react'
import { TextField, Button, Typography } from '@mui/material';
import { useMutation } from '@apollo/client';
import { registerMutation} from '../../gql/mutations'
import { UserContext } from '../../contexts';
import { useHistory } from 'react-router-dom'
import { toast } from 'material-react-toastify';

import './register.scss'

function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [handleRegister, { data, error }] = useMutation(registerMutation);
    const history = useHistory();

    const { user, setUser } = useContext(UserContext);

    useEffect(() => {
        if(data){
            toast.success('Register is successful!')
            history.push('/sign-in')
        }
    }, [data])

    useEffect(() => {
        if(error){
            setUser({isAuthenticated: false, user: null})
        }
    }, [error])

    const onRegister = e => {
        handleRegister({
            variables: {
                name,
                email,
                password
            }
          });
    };
    const handleNameChange = e => {
        setName(e.target.value);
    };
    const handleEmailChange = e => {
        setEmail(e.target.value);
    };
    const handlePasswordChange = e => {
        setPassword(e.target.value);
    };
    return (
        <div className="register">
            <Typography variant="h4" gutterBottom component="div">
                Register
            </Typography>
            <div className="register__form">
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={ name }
              onChange={ handleNameChange }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={ email }
              onChange={ handleEmailChange }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={ password }
              onChange={ handlePasswordChange }
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2 }}
              onClick={e=> onRegister()}
            >
              Register
            </Button>
            </div>
            <div className="register__action">
                <Button>Already have an account? Sign in.</Button>
            </div>
        </div>
    )
}

export default Register

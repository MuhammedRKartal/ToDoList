import React, {useEffect} from 'react'
import { Button, Typography } from '@mui/material';
import { useMutation } from '@apollo/client';
import { removeUserMutation} from '../../gql/mutations'
import { useHistory, useParams } from 'react-router-dom'
import { toast } from 'material-react-toastify';

import './register.scss'

function DeleteUserAndBlock() {
    const { email } = useParams();
    const [handleRemove, { data, error }] = useMutation(removeUserMutation);
    const history = useHistory();

    //if mutation doesn't turn error write success message and go sign in page
    /* useEffect(() => {
        if(data){
            //toast.success('Verification has sent to your email!')
            //history.push(`/activate-account/${data?.register?.token}`)
            //history.push("/sign-in")
        }
    }, [data])
    */
    //if there is an error set user to unauthenticated
    useEffect(() => {
        if(error){
            //setUser({isAuthenticated: false, user: null})
            history.push('/register')
        }
    }, [error])

    //on calling register mutation set variables
    const onDelete = e => {
        handleRemove({
            variables: {
                email
            }
          });
    };
    /*const onBlock = e => {
        handleRegister({
            variables: {
                email
            }
          });
    };
    */

    const onClose = e =>{
        history.push('/sign-in')
    }

    return (
        <div className="register">
            <Typography variant="h4" gutterBottom component="div">
                You can delete your account and block it.
            </Typography>
            <div className="register__form">
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 2 }}
              onClick={e=> onDelete()}
            >
              Delete
            </Button>
            </div>
            <div className="register__action">
                <Button
                    onClick ={e=> onClose()}
                >Already have an account? Sign in.</Button>
            </div>
        </div>
    )
}

export default DeleteUserAndBlock

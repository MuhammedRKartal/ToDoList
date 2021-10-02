import React, {useContext} from 'react'
import { Typography } from '@mui/material';
import {UserContext} from '../../contexts'

function Home() {
    const {user, setUser} = useContext(UserContext);
    return (
        <div>
            <Typography id="modal-modal-title" variant="h4" component="h2">
                Welcome, {user.user.name}!
            </Typography>
            <iframe width="560" height="315" src="https://www.youtube.com/embed/9s48QNorWvM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen/>
        </div>
    )
}

export default Home
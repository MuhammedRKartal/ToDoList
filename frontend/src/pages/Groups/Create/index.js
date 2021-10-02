import React, {useState, useEffect} from 'react'
import { Modal, TextField, Button, Typography, Box, Select, MenuItem, FormControl, InputLabel} from '@mui/material';
import { useMutation } from '@apollo/client';
import { createGroupMutation } from '../../../gql/mutations'

import './group-create.scss';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

function GroupCreate(props) {
    const { modalOpen, setModalOpen } = props;

    //create a state
    const [state, setState] = useState({
        name: '',
    });

    //call the mutation
    const [handleGroupCreate, { data, loading, error }] = useMutation(createGroupMutation);

    //after creating a group, filling the state
    //used in create button of modal
    const onListCreate = () => {
        handleGroupCreate({
            variables: {
                ...state 
            }
        })
    };

    //each time data changes reload the window location
    useEffect(() => {
        if(data){
            window.location.reload()
        }
    }, [data])

    //changes the state on change
    const handleChange = e => {
        setState({...state, [e.target.name]: e.target.value});
    };

    //used in close button of modal
    //creates modal popup
    const handleModalClose = e => {
        setModalOpen(false);
    };

    //modal is to open a popup
    return (
    <Modal
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h4" component="h2">
                Create Group
            </Typography>
            <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Name"
                name="name"
                autoFocus
                value={ state.name }
                onChange={ handleChange }
            />
            <div className="list-create__actions">
                <Button
                type="submit"
                fullWidth
                color="success"
                variant="contained"
                sx={{ mt : 2, mb: 2 }}
                onClick={onListCreate}
                >
                Create
                </Button>

                <Button
                type="submit"
                fullWidth
                color="error"
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
                onClick={handleModalClose}
                >
                Cancel
                </Button>
            </div>
        </Box>
    </Modal>
    )
}

export default GroupCreate

import React, {useState, useEffect} from 'react'
import { Modal, TextField, Button, Typography, Box, Select, MenuItem, FormControl, InputLabel} from '@mui/material';
import { useMutation, useQuery } from '@apollo/client';
import { createListMutation } from '../../../gql/mutations'
import { GET_GROUPS_QUERY } from '../../../gql/queries'
import { toast } from 'material-react-toastify';

import './list-create.scss';

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

function ListCreate(props) {
    const { modalOpen, setModalOpen, refetch } = props;
    const [state, setState] = useState({
        name: '',
        description: '',
        type: '',
        group: ''
    });

    const [handleListCreate, { data, loading, error }] = useMutation(createListMutation);
    const {data: groupsData} = useQuery(GET_GROUPS_QUERY);

    const onListCreate = () => {
        const payload = {...state};
        if(payload.type === 'PRIVATE') delete payload.group
        handleListCreate({
            variables: {
                ...payload 
            }
        })
    };

    useEffect(() => {
        if(data){
            toast.success(`List "${state.name}" is successfully created.`)
            refetch()
            setModalOpen(false)
        }
    }, [data])

    const handleChange = e => {
        setState({...state, [e.target.name]: e.target.value});
    };

    const handleModalClose = e => {
        setModalOpen(false);
    };

    return (
    <Modal
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h4" component="h2">
                Create List
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
            <TextField
                margin="normal"
                required
                fullWidth
                id="description"
                label="Description"
                name="description"
                value={ state.description }
                onChange={ handleChange }
            />
            <FormControl variant="standard" sx={{  width: '98%', marginTop: 2, marginBottom: 2, marginLeft: '5px' }}>
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                    labelId="type-label"
                    fullWidth
                    id="type"
                    label="Type"
                    name="type"
                    placeholder="Type"
                    value={state.type}
                    onChange={handleChange}
                >
                    <MenuItem value="GROUP">Group</MenuItem>
                    <MenuItem value="PRIVATE">Private</MenuItem>
                </Select>
            </FormControl>
            {
                state.type === 'GROUP' && <FormControl variant="standard" sx={{  width: '98%', marginTop: 2, marginBottom: 2, marginLeft: '5px'}}>
                <InputLabel id="group-label">Group</InputLabel>
                <Select
                    labelId="group-label"
                    fullWidth
                    id="group"
                    label="Group"
                    name="group"
                    value={state.group}
                    onChange={handleChange}
                >   
                    {
                        groupsData?.getGroups?.map((group, index) => <MenuItem key={index} value={group.name}>{group.name}</MenuItem>)
                    }
                </Select>
            </FormControl>
            }
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

export default ListCreate

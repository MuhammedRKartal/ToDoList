import React, {useEffect, useState} from 'react'
import ListCard from './ListCard'
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_LISTS_QUERY } from '../../gql/queries';
import { removeListMutation} from '../../gql/mutations'
import ListCreate from './Create';
import { Button, Typography } from '@mui/material';

import './lists.scss';

function Lists() {
    const [getLists, {data, loading, error}] = useLazyQuery(GET_LISTS_QUERY);
    const [handleListDelete, { data: removeListData, loading: removeListLoading, error: removeListError }] = useMutation(removeListMutation);
    const [lists, setLists] = useState([]);
    const [modalOpen, setModalOpen] = React.useState(false);
    const onListDelete = (id) => {
        handleListDelete({
            variables: {
                listId: id
            }
        })
    }

    useEffect(() => {
        getLists({variables: {}});
    }, [])

    useEffect(() => {
        data && setLists(data?.getLists);
    }, [data])

    useEffect(() => {
        if(removeListData){
            getLists();
        } 
    }, [removeListData])


    return (
        <div>
            <div className="lists__header">
                <Typography variant="h4" gutterBottom component="div">
                    Lists
                </Typography>
                <Button color="secondary" variant="outlined" onClick={e=>setModalOpen(true)}>Create new List</Button>
            </div>
            <div className="lists__items-wrapper">
                {lists.map((item, index) => 
                    <ListCard 
                        key={index} 
                        item={item} 
                        onListDelete={onListDelete}
                        refetch={getLists} />)}
            </div>
            {loading && <div>Loading...</div>}
            {error && <div>An error occured. Please try again later.</div>}
            <ListCreate modalOpen={modalOpen} setModalOpen={setModalOpen} refetch={getLists} />

        </div>
    )
}

export default Lists
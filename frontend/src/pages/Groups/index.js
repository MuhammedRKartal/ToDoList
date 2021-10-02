import React, {useEffect, useState} from 'react'
import ListCard from './GroupCard'
import { useLazyQuery } from '@apollo/client';
import { GET_GROUPS_QUERY } from '../../gql/queries';
import ListCreate from './Create';
import { Button, Typography } from '@mui/material';

import './groups.scss';

function Groups() {
    const [getGroups, {data, loading, error}] = useLazyQuery(GET_GROUPS_QUERY);
    const [groups, setGroups] = useState([]);
    const [modalOpen, setModalOpen] = React.useState(false);

    useEffect(() => {
        getGroups({variables: {}});
    }, [])

    useEffect(() => {
        data && setGroups(data?.getGroups);
    }, [data])




    return (
        <div>
            <div className="groups__header">
                <Typography variant="h4" gutterBottom component="div">
                    Groups
                </Typography>
                <Button color="secondary" variant="outlined" onClick={e=>setModalOpen(true)}>Create new Group</Button>
            </div>
            <div className="groups__items-wrapper">
                {groups.map((item, index) => 
                    <ListCard 
                        key={index} 
                        item={item} />)}
            </div>
            {loading && <div>Loading...</div>}
            {error && <div>An error occured. Please try again later.</div>}
            <ListCreate modalOpen={modalOpen} setModalOpen={setModalOpen} />
        </div>
    )
}

export default Groups
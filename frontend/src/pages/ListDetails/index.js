import React, {useState, useEffect, useContext} from 'react'
import { useParams } from 'react-router-dom';
import { GET_LIST_QUERY } from '../../gql/queries';
import { useQuery } from '@apollo/client';
import { Grid, Typography, List, Button } from "@mui/material";
import { withStyles } from "@mui/styles";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import ListItemCreate from './Create';

import { UserContext } from '../../contexts';

import Item from "./Item";
import './list-details.scss';

const styles = theme => ({
    root: {
      flexGrow: 1,
      width: '80%'
    }
  });

function ListDetails(props) {
    const { id } = useParams();
    const { classes } = props;
    const defaultList = {
        id: 'id',
        listItems: []
    }
    const [list, setList] = useState({ ...defaultList });
    const [isDragging, setIsDragging] = useState(false);
    const [modalOpen, setModalOpen] = React.useState(false);
    const { user, setUser } = useContext(UserContext);

    const {data, loading, error, refetch} = useQuery(GET_LIST_QUERY,{
        variables: {
          listId: id
        }
      });
    useEffect(() => {
        if(data) setList(data.getList);
        
    }, [data])
    useEffect(() => {
        if(loading) setList({ ...defaultList });
    }, [loading])
  
      const onDragEnd = ({ source, destination }) => {
        if (destination === undefined || destination === null) return null;
        if (
          source.droppableId === destination.droppableId &&
          destination.index === source.index
        )
          return null;
    
        const column = list.listItems;
 
        const newList = column.filter((_, idx) => idx !== source.index);
  
        // Then insert the item at the right location
        newList.splice(destination.index, 0, column[source.index]);
  
        // Update the state
        setList({ ...list, listItems: newList });
        
        setIsDragging(false);
        return null;
      };
      
      const isListAdmin = data?.getList?.admins.map(item=>item.email).includes(user.user.email)


    return (
        <div>
            {
                data && <div style={{width: '100%'}}>
                    <DragDropContext onBeforeCapture={()=>setIsDragging(true)} onDragEnd={onDragEnd} style={{width: '100%'}}>
                        <Grid container direction={"row"} justify={"center"}>
                            <Grid item className={classes.root}>
                            <div className="list-details__header">
                                <Typography variant={"h4"}>List: <b>{list.name}</b></Typography>
                                {isListAdmin &&
                                  <Button color="secondary" variant="outlined" onClick={e=>setModalOpen(true)}>Create new List Item</Button>
                                }
                            </div>
                            

                            <Droppable droppableId={list.id}>
                                {(provided) => (
                                    <List ref={provided.innerRef}>
                                        {list.listItems?.map((itemObject, index) => {
                                            return <Item isDragging={isDragging} key={index} index={index} itemObject={itemObject} refetch={refetch}/>;
                                        })}
                                        {provided.placeholder}
                                    </List>
                                )}
                            </Droppable>
                            </Grid>
                        </Grid>
                    </DragDropContext>
                </div>
            }
            {loading && <div>Loading...</div>}
            {error && <div>An error occured. Please try again later.</div>}
            <ListItemCreate listId={id} modalOpen={modalOpen} setModalOpen={setModalOpen} refetch={refetch} />
        </div>
    )
}

export default withStyles(styles)(ListDetails);

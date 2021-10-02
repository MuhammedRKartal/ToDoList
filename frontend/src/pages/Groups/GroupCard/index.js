import React, {useState} from 'react'
import { Card, CardActions, CardContent, Button, Typography, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Avatar } from '@mui/material';
import GroupShare from './Share';

import './group-card.scss';

function GroupCard(props) {
    const {item} = props;
    const [openShare, setOpenShare] = useState(false);
   
    const stringToColor = (string) => {
        let hash = 0;
        let i;      
        for (i = 0; i < string.length; i += 1) {
          hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
      
        for (i = 0; i < 3; i += 1) {
          const value = (hash >> (i * 8)) & 0xff;
          color += `00${value.toString(16)}`.substr(-2);
        }
        return color;
      }

    const stringAvatar = (name) => {
        console.log(name)
        const splittedName = name.split(' ');
        return name ? {
          sx: {
            bgcolor: stringToColor(name),
          },
          children: `${splittedName[0][0]}${splittedName.length > 1 ? splittedName[1][0] : ''}`,
        } : {};
      }
    return (
        <div style={{border: `1px solid ${item.users.length > 1 ? 'blue' : 'red'}`}}>
            <Card sx={{ minWidth: 275 }}>
                <CardContent>
                    
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    {item.name}
                    </Typography>
                    <div style={{lineHeight: '40px'}}>Lead: {item.leadMail}</div>
                    <div>
                      <Typography sx={{ mb: 1.5 }} color="text.secondary">
                        Members of the group:
                      </Typography>
                      
                      <div className="group-card__users">
                        {item?.users?.map((user, index)=> {
                          return <div key={index}>
                            <Avatar {...stringAvatar(user.name)} />
                              <span>{user.name}</span>
                            </div>
                        })}
                      </div>
                    </div>
                    
                </CardContent>
                <CardActions>
                    <div className="group-card__buttons">
                        <Button size="small" onClick={()=> setOpenShare(true)}>Share</Button>
                        <Button size="small">View</Button>
                    </div>
                </CardActions>
            </Card>

            <GroupShare
              modalOpen={openShare}
              setModalOpen={setOpenShare}
              groupId={item.id}
              name={item.name}
            />
            
        </div>
    )
}

export default GroupCard;

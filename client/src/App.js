import React, { useState } from 'react';
import RoomJoin from './components/RoomJoin';
import Whiteboard from './components/Whiteboard';

export default function App(){
  const [roomId, setRoomId] = useState('');
  return (
    <div className='app'>
      {!roomId ? <RoomJoin onJoin={(r)=>setRoomId(r)} /> : <Whiteboard roomId={roomId} onLeave={()=>setRoomId('')} />}
    </div>
  );
}

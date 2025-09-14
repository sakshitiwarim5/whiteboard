import React from 'react';

export default function UserCursors({ cursors }){
  return (
    <div>
      {Object.entries(cursors).map(([id, c])=>{
        if(c.x<0) return null;
        return <div key={id} className="user-cursor" style={{left:c.x, top:c.y}}>
          <div style={{background:c.color,borderRadius:6,padding:'2px 6px',color:'#fff'}}>{id.slice(0,4)}</div>
        </div>;
      })}
    </div>
  );
}

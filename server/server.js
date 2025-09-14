const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Room = require('./models/Room');
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whiteboard_db';

mongoose.connect(MONGO_URI, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(()=> console.log('MongoDB connected'))
  .catch(err=> console.error('Mongo connect error', err));

app.post('/api/rooms/join', async (req, res) => {
  const { roomId } = req.body;
  if(!roomId) return res.status(400).json({error:'roomId required'});
  let room = await Room.findOne({ roomId });
  if(!room){
    room = new Room({ roomId, createdAt: new Date(), lastActivity: new Date(), drawingData: [] });
    await room.save();
  }
  res.json({ roomId: room.roomId, createdAt: room.createdAt, lastActivity: room.lastActivity });
});

app.get('/api/rooms/:roomId', async (req, res) => {
  const room = await Room.findOne({ roomId: req.params.roomId });
  if(!room) return res.status(404).json({error:'not found'});
  res.json(room);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const userColors = {};
const COLORS = ['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6'];

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  socket.on('join-room', async ({ roomId }) => {
    socket.join(roomId);
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    userColors[socket.id] = color;
    io.to(roomId).emit('user-count', { count: io.sockets.adapter.rooms.get(roomId)?.size || 1 });
    socket.emit('init-color', { color });
    const room = await Room.findOne({ roomId });
    if(room && room.drawingData && room.drawingData.length) {
      socket.emit('load-commands', room.drawingData);
    }
  });

  socket.on('leave-room', ({roomId}) => {
    socket.leave(roomId);
    delete userColors[socket.id];
    io.to(roomId).emit('user-count', { count: io.sockets.adapter.rooms.get(roomId)?.size || 0 });
  });

  socket.on('cursor-move', ({ roomId, x, y, id }) => {
    socket.to(roomId).emit('cursor-move', { socketId: socket.id, x, y, color: userColors[socket.id] || '#000' });
  });

  socket.on('draw-start', ({ roomId, payload }) => {
    socket.to(roomId).emit('draw-start', { socketId: socket.id, payload });
  });

  socket.on('draw-move', ({ roomId, payload }) => {
    socket.to(roomId).emit('draw-move', { socketId: socket.id, payload });
  });

  socket.on('draw-end', async ({ roomId, command }) => {
    socket.to(roomId).emit('draw-end', { socketId: socket.id, command });
    try {
      await Room.updateOne({ roomId }, { $push: { drawingData: command }, $set: { lastActivity: new Date() } }, { upsert: true });
    } catch(e){ console.error(e); }
  });

  socket.on('clear-canvas', async ({ roomId }) => {
    socket.to(roomId).emit('clear-canvas');
    try {
      await Room.updateOne({ roomId }, { $push: { drawingData: { type:'clear', data:{}, timestamp: new Date() } }, $set: { lastActivity: new Date() } }, { upsert: true });
    } catch(e){ console.error(e); }
  });

  socket.on('disconnecting', () => {
    for(const roomId of socket.rooms){
      if(roomId === socket.id) continue;
      socket.to(roomId).emit('user-left', { socketId: socket.id });
      io.to(roomId).emit('user-count', { count: io.sockets.adapter.rooms.get(roomId)?.size - 1 || 0 });
    }
    delete userColors[socket.id];
  });

  socket.on('disconnect', () => {
    console.log('socket disconnected', socket.id);
  });
});

async function cleanupOldRooms(){
  const cutoff = new Date(Date.now() - 24*60*60*1000);
  await Room.deleteMany({ lastActivity: { $lt: cutoff } });
}
setInterval(cleanupOldRooms, 1000*60*60);

const PORT = process.env.PORT || 5000;
server.listen(PORT, ()=> console.log('Server listening on', PORT));

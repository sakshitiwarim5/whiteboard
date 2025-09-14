const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DrawingCommandSchema = new Schema({
  type: { type: String },
  data: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const RoomSchema = new Schema({
  roomId: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  drawingData: { type: [DrawingCommandSchema], default: [] }
});

module.exports = mongoose.model('Room', RoomSchema);

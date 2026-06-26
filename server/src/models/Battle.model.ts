import { Schema } from 'mongoose';
import { usersDB } from '../config/db';

const BattleSchema = new Schema({
  roomId:      { type: String, required: true, unique: true },
  player1:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  player2:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  problemId:   { type: Schema.Types.ObjectId, ref: 'Question' },
  topic:       { type: String },
  status:      { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  winnerId:    { type: Schema.Types.ObjectId, ref: 'User', default: null },
  player1Code: { type: String, default: '' },
  player2Code: { type: String, default: '' },
  aiFeedback:  { type: String, default: '' },
  p1EloChange: { type: Number, default: 0 },
  p2EloChange: { type: Number, default: 0 },
  duration:    { type: Number, default: 0 },
  startedAt:   { type: Date },
  endedAt:     { type: Date },
}, { timestamps: true });

export default usersDB.model('Battle', BattleSchema);
import { Schema } from 'mongoose';
import { usersDB } from '../config/db';

const UserSchema = new Schema({
  username:   { type: String, required: true, unique: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  password:   { type: String, required: true },
  elo:        { type: Number, default: 1200 },
  wins:       { type: Number, default: 0 },
  losses:     { type: Number, default: 0 },
  streak:     { type: Number, default: 0 },
  avatar:     { type: String, default: '' },
  eloHistory: [{ date: { type: Date, default: Date.now }, elo: Number }],
  followers:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  following:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default usersDB.model('User', UserSchema);